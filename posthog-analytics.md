# PostHog product analytics — scroll sequence

## Project facts (baseline, before edits)

| Fact | Value |
| --- | --- |
| packageManager | `npm` — `package-lock.json`, `lockfileVersion: 3`; no `packageManager` field in `package.json` |
| Original lock paths | `package-lock.json` (only lockfile; no `pnpm-lock.yaml`, `yarn.lock`, `bun.lockb`) |
| Owning package | root package `turing-hackathon` (single app, no workspaces, no private app packages) |
| Framework | Next.js 14 App Router (`app/layout.js`, `app/page.js`), plain JS + JSX, path alias `@/*` → repo root (`jsconfig.json`), inline styles instead of CSS files |
| Toolchain versions | Node v18.20.8, npm 10.8.2, Next 14.2.35 (installed from `^14.2.15`), React 18.3.1 |
| Quality commands | `npm run build` (`next build`) is the only check script. There is **no** `typecheck`, `lint` or `test` script, and no TypeScript, ESLint or test runner installed — `jsconfig.json` means this is a JavaScript project |
| Version control | **No git repository** in this working copy (`git status` → `fatal: not a git repository`); `.gitignore` is provided so local env files stay out once git is initialised |

### Baseline failures (still failing, untouched by this change)

1. `npm run build` fails to compile: `./app/page.js` → `Module not found: Can't resolve '@/components/ScrollSequence'`. The component the page imports does not exist in this working copy (`components/` was empty). Pre-existing, unrelated to analytics, left as is.
2. The same build also hits `EPERM: operation not permitted, open '.next/trace'` because a `next dev` server (PID 29556) is already serving port 3000 and holds `.next`.

## Question

When visitors scroll the sequence story, how deep do they get before they leave, and at which depth does the biggest drop-off happen between the first frame and the last?

## Events

Extends nothing — the project had no analytics before this change, so these are the first events and there are no duplicates.

| Event | Fires when | Properties |
| --- | --- | --- |
| `scroll_sequence_started` | Scroll depth first reaches 5% (once per page view) | `reduced_motion` |
| `scroll_sequence_checkpoint` | Depth first reaches each of 25%, 50%, 75% | `depth_percent` (25 / 50 / 75), `reduced_motion` |
| `scroll_sequence_completed` | Depth first reaches 95%, after the start event | `reduced_motion` |

Every event fires at most once per page view; scrolling back up and down again does not re-emit.

## Triggers (real files and functions)

| Event | File | Function |
| --- | --- | --- |
| all three | [lib/scroll-sequence.mjs](lib/scroll-sequence.mjs) | `createScrollSequenceTracker({ capture, reducedMotion }).track(depthPercent)` — emits through `sanitizeProperties(properties, EVENT_PROPERTIES[event])` |
| all three | [components/ScrollSequenceAnalytics.js](components/ScrollSequenceAnalytics.js) | `measure()` in `useEffect` → `readScrollDepth(window.scrollY, window.innerHeight, document.documentElement.scrollHeight)`; registered on mount, `scroll` and `resize` |
| all three | [lib/posthog.mjs](lib/posthog.mjs) | `createAnalyticsClient(...).capture(event, properties)` → consent gate → `posthog.capture` |
| client instance | [lib/posthog-client.mjs](lib/posthog-client.mjs) | `getAnalyticsClient()` — the single PostHog client (no second singleton) |
| consent | [components/AnalyticsConsent.js](components/AnalyticsConsent.js) | `choose(granted)` → `grantConsent()` / `denyConsent()` |

Mounted once in [app/layout.js](app/layout.js) next to `{children}`.

## Allowed properties

- `depth_percent`: integer 25 / 50 / 75 only.
- `reduced_motion`: boolean from `prefers-reduced-motion: reduce`.
- Nothing else survives: `sanitizeProperties` keeps only declared keys of the declared type, and `scrubEvent` (PostHog `before_send`) deletes `$current_url`, `$pathname`, `$host`, `$referrer`, `$referring_domain`, `$initial_*`, `$session_entry_*`, `$ip`, `$device_id`, plus `$set` / `$set_once` person data.
- No email, password, token or card value can ride along: only the two allowlisted properties exist on these events, and string sentinels fail the type check.

## Identity

The project has no authentication, so the journey stays anonymous: PostHog's own anonymous distinct ID is used and `identify()` is never called from the page. `identify(opaquedId)` exists for a future login and refuses anything that is not `/^(?=.*[A-Za-z])[A-Za-z0-9_-]{8,64}$/` — emails, names and all-digit card/phone strings are rejected. `reset()` runs whenever consent is denied, so no identity is carried past a withdrawal.

## Consent

The project had no CMP and no consent decision, so this change adds the minimal decision source it needed and keeps nothing else:

- `opt_out_capturing_by_default: true` on `posthog.init`, `opt_in_capturing()` only after an explicit grant.
- Decision stored in `localStorage` under `scroll-sequence.analytics-consent` (`granted` / `denied`).
- Undecided means off: `capture()` returns before the SDK is even initialised, so nothing is sent or queued.
- `components/AnalyticsConsent.js` asks once with Allow / Decline; declining calls `opt_out_capturing()` + `reset()` and the bar disappears.
- No cookieless fallback mode.

## Configuration

| Name | Where | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` | `.env.local` (placeholder in [.env.example](.env.example)) | Public project token, never a personal API key |
| `NEXT_PUBLIC_POSTHOG_HOST` | `.env.local` (placeholder in [.env.example](.env.example)) | Explicit ingestion host, e.g. `https://us.i.posthog.com` or `https://eu.i.posthog.com` |

Host is validated (https, no query/hash) and never inspected live. Missing token **or** host → `readAnalyticsConfig().ready === false` → no init, no capture. `.gitignore` covers `.env` and `.env*.local` while keeping `.env.example`.

## Install evidence

- Importer: root package `turing-hackathon` (the only workspace that imports `posthog-js`).
- Command: `npm install posthog-js@1.438.13` (npm, the existing manager; one plain command).
- Manifest: `package.json` → `"posthog-js": "1.438.13"` (exact).
- Resolved: `node_modules/posthog-js` **1.438.13**, `resolved: https://registry.npmjs.org/posthog-js/-/posthog-js-1.438.13.tgz`.
- Lock: same `package-lock.json` kept and updated (`lockfileVersion: 3`, `packages["node_modules/posthog-js"].version = 1.438.13`); no second lockfile, no manager switch.
- Browser SDK only: no `posthog-node` or any other capture package was added (this journey is browser-only; there is no server capture path).

## Privacy defaults on the new client

`autocapture: false`, `capture_pageview: false`, `capture_pageleave: false`, `capture_dead_clicks: false`, `disable_session_recording: true`, `disable_surveys: true`, `capture_performance: false`, `enable_heatmaps: false`, `opt_out_capturing_by_default: true`, `respect_dnt: true`, `before_send: scrubEvent`. No replay, surveys, error collection or feature flags.

## Offline verification

`node posthog-analytics.verify.mjs` — runs `node --test` on `test/posthog-analytics.test.mjs` with `shell: false`, a 120s bound, an empty child env plus OS/path values and fixed synthetic configuration (`synthetic-project-token` / `https://us.i.posthog.com`, never a real token literal), and no dotenv/framework autoload. It fails on a missing runner, a missing test file or zero assertions.

Current result: **11 tests passed, 88 assertions, 0 network attempts**. Covered:

- missing token or host → SDK never initialised, nothing sent;
- undecided or denied consent → nothing sent;
- granted consent → one `posthog.init` with the privacy defaults, then `started` → checkpoints 25/50/75 → `completed`, each exactly once, carrying only allowlisted properties;
- email / password / token / card sentinels and URL / referrer / person metadata excluded;
- transport errors → `false` return, no throw, handler state preserved;
- opaque identity accepted, email rejected, reset on withdrawal;
- manifest + lock still pin `posthog-js` 1.438.13 and no server SDK was added.

Also checked: all changed source files parse with Next's own SWC parser (`next/dist/build/swc`), used because `next build` cannot reach these files while the pre-existing missing `@/components/ScrollSequence` module fails the compile.

## Live analysis

PostHog insight: **funnel**, steps `scroll_sequence_started` → `scroll_sequence_checkpoint` where `depth_percent = 75` → `scroll_sequence_completed`, last 7 days compared with the previous 7.

- Event order: started, then checkpoints ascending (25 → 50 → 75), then completed; each at most once per page view, all under the same anonymous distinct ID.
- Denominator: unique visitors who fired `scroll_sequence_started` in the window.
- Success measure: completion rate = `scroll_sequence_completed` ÷ `scroll_sequence_started`; the conversion rate of each step shows where the sequence loses people (the largest step drop-off is the leak).
- Secondary breakdown: same funnel split by `reduced_motion` to see whether motion-sensitive visitors bail earlier.

A useful insight reads like: "Of N visitors who started the sequence in the last 7 days, X% reached 75% and Y% finished; the biggest drop-off is between 50% and 75%, so the middle of the story is where it loses people."

## Still pending

The live insight is **not** verified: no PostHog project is configured for this working copy and no event has been delivered. That needs (1) a PostHog project with its public token and ingestion host in `.env.local`, (2) analytics consent granted in the browser, and (3) the pre-existing missing `components/ScrollSequence` module, without which `app/page.js` cannot render the sequence.
