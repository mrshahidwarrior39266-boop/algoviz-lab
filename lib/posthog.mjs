/**
 * PostHog product analytics for the scroll sequence.
 *
 * Configuration is read only from public NEXT_PUBLIC_* values. When the project
 * token or the host is missing every call is a no-op, capture is gated on an
 * explicit consent decision (no decision means off), automatic PostHog metadata
 * is scrubbed, and analytics failures never reach the page.
 */

export const POSTHOG_TOKEN_ENV = 'NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN';
export const POSTHOG_HOST_ENV = 'NEXT_PUBLIC_POSTHOG_HOST';

/** Where the consent decision is remembered in localStorage. */
export const CONSENT_STORAGE_KEY = 'scroll-sequence.analytics-consent';

export const CONSENT_GRANTED = 'granted';
export const CONSENT_DENIED = 'denied';
export const CONSENT_UNDECIDED = 'undecided';

/**
 * Automatic PostHog properties that carry URLs, referrers or person data.
 * They are removed from every event before it leaves the page.
 */
export const SCRUBBED_PROPERTIES = Object.freeze([
  '$current_url',
  '$pathname',
  '$host',
  '$referrer',
  '$referring_domain',
  '$initial_current_url',
  '$initial_pathname',
  '$initial_referrer',
  '$initial_referring_domain',
  '$session_entry_url',
  '$session_entry_pathname',
  '$session_entry_referrer',
  '$session_entry_referring_domain',
  '$ip',
  '$device_id',
]);

/** Automatic event fields that hold person data. */
export const SCRUBBED_EVENT_FIELDS = Object.freeze(['$set', '$set_once']);

const STRING_TYPES = { number: 'number', boolean: 'boolean' };

function asText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/** A host is usable only when it is an https ingestion URL without query or hash. */
export function isIngestionHost(host) {
  const candidate = asText(host);
  if (!candidate) return false;
  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' && Boolean(url.hostname) && !url.search && !url.hash;
  } catch {
    return false;
  }
}

/**
 * Resolves the public configuration. `ready` is false when either value is
 * missing or the host is not a plain https URL, which keeps capture off.
 */
export function readAnalyticsConfig(env = {}) {
  const token = asText(env[POSTHOG_TOKEN_ENV]);
  const host = asText(env[POSTHOG_HOST_ENV]);
  return { token, host, ready: Boolean(token) && isIngestionHost(host) };
}

/** Keeps only the declared keys, coerced to their declared primitive type. */
export function sanitizeProperties(properties, schema = {}) {
  const safe = {};
  if (!properties || typeof properties !== 'object' || !schema || typeof schema !== 'object') {
    return safe;
  }
  for (const [key, expected] of Object.entries(schema)) {
    if (!Object.prototype.hasOwnProperty.call(properties, key)) continue;
    const value = properties[key];
    if (STRING_TYPES[expected] !== typeof value) continue;
    if (typeof value === 'number' && !Number.isFinite(value)) continue;
    safe[key] = value;
  }
  return safe;
}

/**
 * `before_send` hook: strips automatic URL, referrer and person metadata from
 * the event PostHog built, keeping only app properties.
 */
export function scrubEvent(event) {
  if (!event || typeof event !== 'object') return null;
  const scrubbed = { ...event };
  for (const field of SCRUBBED_EVENT_FIELDS) delete scrubbed[field];
  const properties = scrubbed.properties;
  if (properties && typeof properties === 'object') {
    const kept = {};
    for (const [key, value] of Object.entries(properties)) {
      if (SCRUBBED_PROPERTIES.includes(key)) continue;
      kept[key] = value;
    }
    scrubbed.properties = kept;
  }
  return scrubbed;
}

export function readConsentDecision(storage) {
  if (!storage || typeof storage.getItem !== 'function') return CONSENT_UNDECIDED;
  try {
    const stored = storage.getItem(CONSENT_STORAGE_KEY);
    if (stored === CONSENT_GRANTED) return CONSENT_GRANTED;
    if (stored === CONSENT_DENIED) return CONSENT_DENIED;
    return CONSENT_UNDECIDED;
  } catch {
    return CONSENT_UNDECIDED;
  }
}

export function writeConsentDecision(storage, decision) {
  if (!storage || typeof storage.setItem !== 'function') return false;
  if (decision !== CONSENT_GRANTED && decision !== CONSENT_DENIED) return false;
  try {
    storage.setItem(CONSENT_STORAGE_KEY, decision);
    return true;
  } catch {
    return false;
  }
}

/**
 * Only opaque, token-shaped identifiers are accepted: emails, names and pure
 * digit strings (card or phone numbers) are refused.
 */
export function isOpaqueDistinctId(distinctId) {
  return (
    typeof distinctId === 'string' && /^(?=.*[A-Za-z])[A-Za-z0-9_-]{8,64}$/.test(distinctId)
  );
}

/**
 * Creates the analytics client around an injected PostHog SDK namespace.
 * `sdk` is `posthog-js` in the app and an in-memory fake in the offline tests.
 */
export function createAnalyticsClient({ env = {}, sdk = null, storage = null } = {}) {
  const config = readAnalyticsConfig(env);
  let initializationAttempted = false;
  let clientReady = false;

  function initialize() {
    if (initializationAttempted) return clientReady;
    initializationAttempted = true;
    if (!config.ready || !sdk || typeof sdk.init !== 'function') return false;
    try {
      sdk.init(config.token, {
        api_host: config.host,
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        capture_dead_clicks: false,
        disable_session_recording: true,
        disable_surveys: true,
        capture_performance: false,
        enable_heatmaps: false,
        opt_out_capturing_by_default: true,
        respect_dnt: true,
        before_send: scrubEvent,
      });
      clientReady = true;
      if (readConsentDecision(storage) === CONSENT_GRANTED) {
        sdk.opt_in_capturing();
      } else {
        sdk.opt_out_capturing();
      }
    } catch {
      clientReady = false;
    }
    return clientReady;
  }

  function getConsentDecision() {
    return readConsentDecision(storage);
  }

  function hasConsent() {
    return getConsentDecision() === CONSENT_GRANTED;
  }

  function capture(event, properties = {}) {
    try {
      if (typeof event !== 'string' || !event) return false;
      if (!hasConsent()) return false;
      if (!initialize()) return false;
      sdk.capture(event, properties);
      return true;
    } catch {
      return false;
    }
  }

  function identify(distinctId) {
    try {
      if (!isOpaqueDistinctId(distinctId)) return false;
      if (!hasConsent()) return false;
      if (!initialize()) return false;
      sdk.identify(distinctId);
      return true;
    } catch {
      return false;
    }
  }

  function grantConsent() {
    try {
      const ready = initialize();
      const persisted = writeConsentDecision(storage, CONSENT_GRANTED);
      if (!ready || !persisted) return false;
      sdk.opt_in_capturing();
      return true;
    } catch {
      return false;
    }
  }

  function denyConsent() {
    try {
      const ready = initialize();
      const persisted = writeConsentDecision(storage, CONSENT_DENIED);
      if (!ready || !persisted) return false;
      sdk.opt_out_capturing();
      sdk.reset();
      return true;
    } catch {
      return false;
    }
  }

  function reset() {
    try {
      if (!initialize()) return false;
      sdk.reset();
      return true;
    } catch {
      return false;
    }
  }

  return {
    capture,
    identify,
    reset,
    grantConsent,
    denyConsent,
    getConsentDecision,
    hasConsent,
    isReady: () => config.ready,
    getConfig: () => ({ ...config }),
  };
}
