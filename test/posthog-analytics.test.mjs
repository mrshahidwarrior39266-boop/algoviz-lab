/**
 * Offline proof for the scroll sequence analytics.
 *
 * These tests import the real modules used by the page, inject a synthetic
 * project token and an in-memory PostHog SDK, and deny the network. No event
 * ever leaves this process.
 */

import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  CONSENT_DENIED,
  CONSENT_GRANTED,
  CONSENT_STORAGE_KEY,
  POSTHOG_HOST_ENV,
  POSTHOG_TOKEN_ENV,
  createAnalyticsClient,
  isOpaqueDistinctId,
  readAnalyticsConfig,
  sanitizeProperties,
  scrubEvent,
} from '../lib/posthog.mjs';
import {
  CHECKPOINT_DEPTHS,
  EVENTS,
  EVENT_PROPERTIES,
  createScrollSequenceTracker,
  readScrollDepth,
} from '../lib/scroll-sequence.mjs';

const SYNTHETIC_TOKEN = 'synthetic-project-token';
const SYNTHETIC_HOST = 'https://us.i.posthog.com';
const SYNTHETIC_ENV = {
  [POSTHOG_TOKEN_ENV]: SYNTHETIC_TOKEN,
  [POSTHOG_HOST_ENV]: SYNTHETIC_HOST,
};

let networkAttempts = 0;
globalThis.fetch = () => {
  networkAttempts += 1;
  throw new Error('network denied in offline verification');
};

const EMAIL_SENTINEL = 'student@example.test';
const PASSWORD_SENTINEL = 'correct-horse-battery-staple';
const TOKEN_SENTINEL = 'synthetic-api-token-value';
const CARD_SENTINEL = '4242424242424242';

function createMemoryStorage(initial = {}) {
  const entries = new Map(Object.entries(initial));
  return {
    getItem: (key) => (entries.has(key) ? entries.get(key) : null),
    setItem: (key, value) => {
      entries.set(key, String(value));
    },
    removeItem: (key) => {
      entries.delete(key);
    },
  };
}

function grantedStorage() {
  return createMemoryStorage({ [CONSENT_STORAGE_KEY]: CONSENT_GRANTED });
}

function createFakeSdk({ failCapture = false } = {}) {
  const calls = {
    init: [],
    capture: [],
    identify: [],
    reset: 0,
    optIn: 0,
    optOut: 0,
  };
  return {
    calls,
    init(token, options) {
      calls.init.push({ token, options });
    },
    capture(event, properties) {
      if (failCapture) throw new Error('transport unavailable');
      calls.capture.push({ event, properties });
    },
    identify(distinctId) {
      calls.identify.push(distinctId);
    },
    reset() {
      calls.reset += 1;
    },
    opt_in_capturing() {
      calls.optIn += 1;
    },
    opt_out_capturing() {
      calls.optOut += 1;
    },
  };
}

function readProjectJson(name) {
  return JSON.parse(readFileSync(new URL(`../${name}`, import.meta.url), 'utf8'));
}

after(() => {
  assert.equal(networkAttempts, 0, 'no test may perform network delivery');
});

test('configuration needs both a public token and an https ingestion host', () => {
  assert.equal(readAnalyticsConfig({}).ready, false);
  assert.equal(
    readAnalyticsConfig({ [POSTHOG_HOST_ENV]: SYNTHETIC_HOST }).ready,
    false,
    'missing token keeps capture off'
  );
  assert.equal(
    readAnalyticsConfig({ [POSTHOG_TOKEN_ENV]: SYNTHETIC_TOKEN }).ready,
    false,
    'missing host keeps capture off'
  );
  assert.equal(
    readAnalyticsConfig({
      [POSTHOG_TOKEN_ENV]: SYNTHETIC_TOKEN,
      [POSTHOG_HOST_ENV]: 'us.i.posthog.com',
    }).ready,
    false,
    'a host without https is not an ingestion host'
  );
  assert.equal(
    readAnalyticsConfig({
      [POSTHOG_TOKEN_ENV]: SYNTHETIC_TOKEN,
      [POSTHOG_HOST_ENV]: `${SYNTHETIC_HOST}/?region=us`,
    }).ready,
    false,
    'query strings are rejected'
  );
  assert.equal(readAnalyticsConfig(SYNTHETIC_ENV).ready, true);
  assert.equal(readAnalyticsConfig(SYNTHETIC_ENV).token, SYNTHETIC_TOKEN);
});

test('missing token or host is a no-op: nothing initializes and nothing is sent', () => {
  for (const env of [
    { [POSTHOG_HOST_ENV]: SYNTHETIC_HOST },
    { [POSTHOG_TOKEN_ENV]: SYNTHETIC_TOKEN },
    {},
  ]) {
    const sdk = createFakeSdk();
    const client = createAnalyticsClient({ env, sdk, storage: grantedStorage() });
    const tracker = createScrollSequenceTracker({ capture: client.capture });
    tracker.track(100);
    assert.equal(client.capture(EVENTS.STARTED, {}), false);
    assert.equal(client.grantConsent(), false);
    assert.equal(sdk.calls.init.length, 0, 'the SDK is never initialized without config');
    assert.equal(sdk.calls.capture.length, 0);
  }
});

test('no consent decision means off, and denied consent stays off', () => {
  const undecidedSdk = createFakeSdk();
  const undecided = createAnalyticsClient({
    env: SYNTHETIC_ENV,
    sdk: undecidedSdk,
    storage: createMemoryStorage(),
  });
  const undecidedTracker = createScrollSequenceTracker({ capture: undecided.capture });
  undecidedTracker.track(100);
  assert.equal(undecided.getConsentDecision(), 'undecided');
  assert.equal(undecided.capture(EVENTS.STARTED, {}), false);
  assert.equal(undecidedSdk.calls.init.length, 0);
  assert.equal(undecidedSdk.calls.capture.length, 0);

  const deniedSdk = createFakeSdk();
  const denied = createAnalyticsClient({
    env: SYNTHETIC_ENV,
    sdk: deniedSdk,
    storage: createMemoryStorage({ [CONSENT_STORAGE_KEY]: CONSENT_DENIED }),
  });
  const deniedTracker = createScrollSequenceTracker({ capture: denied.capture });
  deniedTracker.track(100);
  assert.equal(denied.capture(EVENTS.STARTED, {}), false);
  assert.equal(deniedSdk.calls.capture.length, 0);
});

test('granted consent initializes the privacy defaults once and emits the contract once', () => {
  const sdk = createFakeSdk();
  const storage = createMemoryStorage();
  const client = createAnalyticsClient({ env: SYNTHETIC_ENV, sdk, storage });
  assert.equal(client.grantConsent(), true);

  assert.equal(sdk.calls.init.length, 1, 'one client is initialized');
  const { token, options } = sdk.calls.init[0];
  assert.equal(token, SYNTHETIC_TOKEN);
  assert.equal(options.api_host, SYNTHETIC_HOST);
  assert.equal(options.autocapture, false);
  assert.equal(options.capture_pageview, false);
  assert.equal(options.capture_pageleave, false);
  assert.equal(options.capture_dead_clicks, false);
  assert.equal(options.disable_session_recording, true);
  assert.equal(options.opt_out_capturing_by_default, true);
  assert.equal(typeof options.before_send, 'function');
  assert.equal(sdk.calls.optIn, 1);

  const tracker = createScrollSequenceTracker({ capture: client.capture, reducedMotion: true });
  assert.equal(tracker.track(0), 0, 'no event before the sequence starts');
  assert.equal(tracker.track(10), 1);
  assert.equal(tracker.track(30), 1);
  assert.equal(tracker.track(30), 0, 'a checkpoint is not repeated');
  assert.equal(tracker.track(60), 1);
  assert.equal(tracker.track(100), 2);
  assert.equal(tracker.track(100), 0, 'completion is not repeated');

  assert.deepEqual(
    sdk.calls.capture.map((call) => call.event),
    [
      EVENTS.STARTED,
      EVENTS.CHECKPOINT,
      EVENTS.CHECKPOINT,
      EVENTS.CHECKPOINT,
      EVENTS.COMPLETED,
    ]
  );
  assert.deepEqual(
    sdk.calls.capture
      .filter((call) => call.event === EVENTS.CHECKPOINT)
      .map((call) => call.properties.depth_percent),
    CHECKPOINT_DEPTHS
  );
  for (const call of sdk.calls.capture) {
    assert.deepEqual(
      Object.keys(call.properties).sort(),
      Object.keys(EVENT_PROPERTIES[call.event]).sort(),
      `${call.event} carries only its allowlisted properties`
    );
  }
  assert.deepEqual(tracker.getState(), {
    started: true,
    completed: true,
    checkpoints: [...CHECKPOINT_DEPTHS],
  });
});

test('allowlisted properties drop email, password, token and card sentinels', () => {
  const safe = sanitizeProperties(
    {
      depth_percent: 75,
      email: EMAIL_SENTINEL,
      password: PASSWORD_SENTINEL,
      api_token: TOKEN_SENTINEL,
      card_number: CARD_SENTINEL,
    },
    EVENT_PROPERTIES[EVENTS.CHECKPOINT]
  );
  assert.deepEqual(safe, { depth_percent: 75 });
  assert.equal(JSON.stringify(safe).includes(EMAIL_SENTINEL), false);
  assert.equal(JSON.stringify(safe).includes(CARD_SENTINEL), false);

  const wrongTypes = sanitizeProperties(
    { depth_percent: EMAIL_SENTINEL, reduced_motion: PASSWORD_SENTINEL },
    EVENT_PROPERTIES[EVENTS.CHECKPOINT]
  );
  assert.deepEqual(wrongTypes, {}, 'sentinels cannot ride in allowlisted keys');
});

test('before_send scrubs URL, referrer and person metadata from automatic events', () => {
  const scrubbed = scrubEvent({
    event: '$autocapture',
    distinct_id: 'synthetic-distinct-id',
    properties: {
      $current_url: `https://example.test/?email=${EMAIL_SENTINEL}`,
      $pathname: '/',
      $referrer: `https://search.example/?q=${CARD_SENTINEL}`,
      $referring_domain: 'search.example',
      $initial_current_url: 'https://example.test/',
      $ip: '203.0.113.7',
      $browser: 'Chrome',
      depth_percent: 50,
    },
    $set: { email: EMAIL_SENTINEL },
    $set_once: { first_touch: 'https://example.test/' },
  });

  assert.equal(scrubbed.event, '$autocapture');
  assert.equal(scrubbed.$set, undefined, 'person properties are removed');
  assert.equal(scrubbed.$set_once, undefined);
  assert.deepEqual(Object.keys(scrubbed.properties).sort(), ['$browser', 'depth_percent']);
  const serialized = JSON.stringify(scrubbed);
  for (const sentinel of [EMAIL_SENTINEL, CARD_SENTINEL, '203.0.113.7', 'search.example']) {
    assert.equal(serialized.includes(sentinel), false, 'no URL or referrer data survives');
  }
  assert.equal(scrubEvent(null), null);
});

test('the configured client scrubs automatic metadata through the sdk hook', () => {
  const sdk = createFakeSdk();
  const client = createAnalyticsClient({ env: SYNTHETIC_ENV, sdk, storage: grantedStorage() });
  client.capture(EVENTS.STARTED, { reduced_motion: false });
  const beforeSend = sdk.calls.init[0].options.before_send;
  const outgoing = beforeSend({
    event: EVENTS.STARTED,
    properties: {
      $current_url: `https://example.test/?token=${TOKEN_SENTINEL}`,
      $referrer: 'https://example.test/previous',
      reduced_motion: false,
    },
  });
  assert.deepEqual(outgoing.properties, { reduced_motion: false });
  assert.equal(JSON.stringify(outgoing).includes(TOKEN_SENTINEL), false);
});

test('transport failures are harmless for the page', () => {
  const sdk = createFakeSdk({ failCapture: true });
  const client = createAnalyticsClient({ env: SYNTHETIC_ENV, sdk, storage: grantedStorage() });
  const tracker = createScrollSequenceTracker({ capture: client.capture });

  assert.equal(client.capture(EVENTS.STARTED, {}), false);
  assert.doesNotThrow(() => tracker.track(100));
  assert.equal(tracker.track(100), 0);
  assert.equal(sdk.calls.capture.length, 0, 'a failed send never records a false success');
  assert.deepEqual(tracker.getState(), {
    started: true,
    completed: true,
    checkpoints: [...CHECKPOINT_DEPTHS],
  });
  assert.equal(readScrollDepth(0, 800, 4000), 0);
  assert.equal(readScrollDepth(3200, 800, 4000), 100);
  assert.equal(readScrollDepth(1600, 800, 4000), 50);
});

test('only opaque identifiers are identified, and denial resets the client', () => {
  assert.equal(isOpaqueDistinctId('a1b2c3d4e5f6'), true);
  assert.equal(isOpaqueDistinctId(EMAIL_SENTINEL), false);
  assert.equal(isOpaqueDistinctId('short'), false);
  assert.equal(isOpaqueDistinctId(`${CARD_SENTINEL}`), false);

  const sdk = createFakeSdk();
  const storage = grantedStorage();
  const client = createAnalyticsClient({ env: SYNTHETIC_ENV, sdk, storage });
  assert.equal(client.identify(EMAIL_SENTINEL), false, 'emails are not identities');
  assert.equal(client.identify('a1b2c3d4e5f6'), true);
  assert.deepEqual(sdk.calls.identify, ['a1b2c3d4e5f6']);

  assert.equal(client.reset(), true);
  assert.equal(sdk.calls.reset, 1);

  assert.equal(client.denyConsent(), true);
  assert.equal(client.getConsentDecision(), CONSENT_DENIED);
  assert.equal(client.hasConsent(), false);
  assert.equal(sdk.calls.optOut, 1);
  assert.equal(sdk.calls.reset, 2, 'denying consent resets the visitor');
  assert.equal(client.capture(EVENTS.COMPLETED, {}), false, 'capture stops after denial');
});

test('the manifest pins posthog-js 1.438.13 and the lock resolves that exact version', () => {
  const pkg = readProjectJson('package.json');
  const lock = readProjectJson('package-lock.json');

  assert.equal(pkg.dependencies['posthog-js'], '1.438.13', 'the manifest pins the version');
  assert.equal(lock.lockfileVersion, 3);
  assert.equal(lock.packages[''].dependencies['posthog-js'], '1.438.13');
  assert.equal(lock.packages['node_modules/posthog-js'].version, '1.438.13');
  assert.match(
    lock.packages['node_modules/posthog-js'].resolved,
    /registry\.npmjs\.org\/posthog-js\/-\/posthog-js-1\.438\.13\.tgz$/
  );

  const posthogPackages = Object.keys(lock.packages).filter((name) => /(^|\/)@?posthog/.test(name));
  assert.equal(
    posthogPackages.filter((name) => name.startsWith('node_modules/posthog-node')).length,
    0,
    'this browser-only integration adds no server SDK'
  );
  assert.equal(
    Object.keys(pkg.dependencies).filter((name) => /^@?posthog/.test(name)).join(','),
    'posthog-js',
    'exactly one PostHog package is a direct dependency'
  );
});

test('this run is offline, synthetic and free of real token literals', () => {
  assert.equal(process.env[POSTHOG_TOKEN_ENV], SYNTHETIC_TOKEN);
  assert.equal(process.env[POSTHOG_HOST_ENV], SYNTHETIC_HOST);
  assert.equal(/^ph[cx]_/.test(SYNTHETIC_TOKEN), false, 'the token is not a real literal');
  for (const name of ['POSTHOG_API_KEY', 'POSTHOG_PERSONAL_API_KEY', 'NEXT_PUBLIC_POSTHOG_KEY']) {
    assert.equal(process.env[name], undefined, `${name} must not reach the test process`);
  }

  const tokenPattern = /ph[cx]_[A-Za-z0-9]{10,}/;
  for (const file of [
    '../lib/posthog.mjs',
    '../lib/posthog-client.mjs',
    '../lib/scroll-sequence.mjs',
    '../components/AnalyticsConsent.js',
    '../components/ScrollSequenceAnalytics.js',
    '../.env.example',
  ]) {
    const contents = readFileSync(new URL(file, import.meta.url), 'utf8');
    assert.equal(tokenPattern.test(contents), false, `${file} carries no token literal`);
  }
});
