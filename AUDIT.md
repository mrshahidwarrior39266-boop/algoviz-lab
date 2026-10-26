# AlgoViz — Flaw & Verification Report

**Date:** 2026-10-26  
**Scope:** full implementation rewritten in this workspace, build, automated traces, browser interaction,
OAuth wiring, deployment and repository hygiene.

## Verification performed

| Check | Result |
| --- | --- |
| `npm test` (9 tests) | **Pass** — all algorithms, arrays, counters, depth, share sanitization, anchors, badges |
| `npm run build` (Next.js 15.5.28 / React 19.2) | **Pass** — 5 routes, 146 kB first-load JS on `/` |
| `npm audit` | **0 vulnerabilities** (postcss and sharp overrides applied) |
| Browser lab playback, pause, step, scrub | **Pass** — hash updates to exact step |
| Editable JS sandbox (changed comparator to `<`) | **Pass** — 164 custom frames captured; unsorted result reported |
| Prediction XP, streak and reload persistence | **Pass** — XP and answers survive reload; no duplicate XP on reload |
| Lesson completion (Quick Sort, 60 XP) | **Pass** — persisted and badge derived |
| Race with Bubble vs Quick | **Pass** — Quick wins with 71 fewer operations (55% less measured work) |
| Race with any two algorithms | **Pass** — Insertion vs Selection dropdowns update, run, share |
| Share URL direct load | **Pass** — algorithm, array, step and C++ tab restored exactly |
| Race share at final tick | **Pass** — winner shown without awarding race XP |
| Debug dojo correct line | **Pass** — bug line revealed, explanation, +25 XP |
| Google OAuth redirect construction (placeholder credentials) | **Pass** — provider redirects to `accounts.google.com` with correct client, callback, scope and state |
| Production server + security headers | **Pass** — `X-Frame-Options`, `X-Content-Type-Options`, referrer and permissions policies |
| Responsive DOM at 1440 / 375 px | **Pass** — no horizontal overflow; mobile header 116 px after fix |
| Console errors during tested flows | **None observed** |
| `node posthog-analytics.verify.mjs` (11 tests / 88 assertions) | **Pass** — consent gate, event allowlist, no network delivery |
| Production deploy (`https://algoviz-lab-chi.vercel.app`) | **Pass** — `/`, `/signin`, `/api/auth/providers`, `/api/auth/csrf` all 200 with correct content types; JS chunk 200; security headers present |
| Production live playback | **Pass** — stepping updates the HUD (C=5, W=8, S=4 after 10 steps), efficiency meter 100%→91%, share hash tracks `step=10`; **zero console errors** |

Google sign-in could not complete end-to-end because no usable Google OAuth client secret exists
anywhere reachable from this environment:

- Vercel (all 7 projects × all environments) exposes only a `GOOGLE_CLIENT_ID` in
  `attendance-ble`, and its stored value is returned **masked** (`[SENSITIVE]`) — no secret.
- GitHub code search across all 9 of your repositories finds `GOOGLE_CLIENT_SECRET` only in
  `SIH-2026/backend/.env`, where both values are the placeholders `your_google_client_..._here`.

Everything else is wired: the provider, the callback URL, `NEXTAUTH_SECRET` and `NEXTAUTH_URL`
are set in Vercel production, and `/signin` shows the exact redirect URI to authorize:

```
https://algoviz-lab-chi.vercel.app/api/auth/callback/google
```

The moment `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` are added in Vercel and the deployment is
redeployed, the button activates (no code change needed).

## Issues fixed during implementation

1. **The workspace had no application.** The only page imported a missing `ScrollSequence`
   component. The complete app was rebuilt in the requested location.
2. **NextAuth failed the production build** (`c(...) is not a function`) under this ESM package.
   The CJS default exports are now explicitly unwrapped; the route builds and serves.
3. **Race finished on recorded frames**, making Quick Sort beat Bubble Sort by only one frame.
   The race now advances on measured work (comparisons + writes), so the intended Big-O contrast
   is honest and visible.
4. **Prediction quiz re-showed "+10 XP" after reload.** The UI now distinguishes a new award from
   a previously saved answer.
5. **Custom-trace URLs were misleading.** Lab URL syncing pauses while a custom sandbox trace is
   active, because the URL cannot carry arbitrary learner code.
6. **Mobile header was 161 px tall.** Brand and account controls now share the first row
   (116 px at 375 px).
7. **Auth was gated by a build-time flag.** The session provider is always mounted, so a valid
   Google session is reflected immediately; the dynamic sign-in page reads the OAuth env at
   request time.
8. **Monaco used an unpinned CDN latest version.** It is pinned to `monaco-editor@0.52.2`.
9. **Grammar and layout defects** (`1 languages viewed`, absolute-positioned level caption) fixed.
10. **Supply-chain advisories** from Next 14 / old PostCSS / sharp were removed by moving to the
    patched Next 15.5.28 + React 19 stack and overriding transitive versions.
11. **The sponsored PostHog analytics drop did not compile as delivered.** `AnalyticsConsent.js`
    imported `CONSENT_UNDECIDED` from `lib/posthog-client.mjs`, which never exported it, and
    `posthog-js` was imported but absent from `package.json`. The constants are now re-exported
    and `posthog-js` is installed at the exact pinned `1.438.13` the shipped tests assert.
12. **The consent bar prompted for analytics that could not run.** It now renders only when a
    token/host is actually configured (`isReady()`), so visitors are never asked about analytics
    in a build that has none; its copy was also corrected from "this story" to AlgoViz.
13. **`.gitignore` ended with `.env*`, which would have excluded `.env.example`** from the
    repository. A `!.env.example` exception (and `.oauth-inspect/`) was added.

## Remaining limitations (known, not silently ignored)

### High priority before public launch

1. **Google OAuth is not configured on the deployment.** Add `GOOGLE_CLIENT_ID` and
   `GOOGLE_CLIENT_SECRET` in Vercel → Settings → Environment Variables (they do not exist in any
   reachable store — see above), authorize the exact callback URI, and redeploy. `NEXTAUTH_SECRET`
   and `NEXTAUTH_URL` are **already set**. Until then `/signin` intentionally shows setup guidance
   and the Google button is disabled.
2. **No cloud persistence.** XP, badges and streak live in one browser's `localStorage`. Signing in
   identifies the learner but does not sync progress. Adding a database would require a privacy
   notice, account deletion and server-side validation; it was deliberately out of scope.
3. **The code sandbox is not a security boundary.** It runs learner JavaScript in a Web Worker,
   blocks `fetch` / `XMLHttpRequest` / `WebSocket` / `importScripts`, caps time at 3 seconds and caps
   steps at 3,000. It cannot access the DOM, but `new Function` executes in the worker and local
   resource exhaustion is possible. Never accept third-party submitted code through it; move
   untrusted submissions to a server-side isolated runner.
4. **No Content-Security-Policy.** Monaco is loaded from jsDelivr, so a CSP needs an explicit
   `script-src`/`worker-src` allowlist. Add CSP and SRI after moving Monaco to a self-hosted build
   for maximum supply-chain control.

### Lower priority5. **Race is not a wall-clock benchmark.** It compares measured operations on the same input, which is the point; machine/JIT timing would need a controlled harness and confidence intervals.
6. **Analytics are configured but inert.** No PostHog token exists in this deployment, so the
   consent bar never appears and no event is ever sent. If a token is added later, capture still
   requires an explicit visitor opt-in per browser.
7. **No cross-tab synchronization.** Two open tabs can hold different in-memory progress until
   reload; the last write to `localStorage` wins.
8. **OAuth preview callbacks** need their own authorized redirect URI if sign-in is tested on Vercel
   preview deployments.
9. **Google avatar images are hotlinked** from Google with `referrerPolicy="no-referrer"`; no image
   proxy is used.
10. **Accessibility has been checked for labels, focus, keyboard playback and reduced motion**, but
   not with a formal WCAG 2.2 AA audit or screen-reader matrix.
11. **No automated E2E suite is committed.** The trace/validation suite is automated; browser
    flows were exercised manually through the preview. Add Playwright if this becomes a maintained
    product.

## Recommended hardening backlog

- Move student execution to a server-side isolate (e.g., a microVM or dedicated runner) only if
  submissions become untrusted.
- Add a D1/Postgres progress table with authenticated, validated writes if cloud sync is wanted.
- Add a strict CSP with nonces and a self-hosted Monaco bundle.
- Add per-account export/delete controls before storing any server-side learning data.
- Add Playwright coverage for lab, race, debug, persistence and auth callback.
- Add rate limiting and error monitoring only when a backend is introduced.
