# AlgoViz — Sorting, made visible

An interactive sorting laboratory built for students who learn better by **seeing the work**.
AlgoViz replays every comparison and write, lets learners edit the JavaScript, races any two
algorithms on the same array, and asks them to debug broken invariants.

## What is inside

| Feature | Where |
| --- | --- |
| Editable Monaco sandbox with a traced Web Worker | **Lab → Code workbench** |
| Comparisons, writes, swaps, recursion depth, Big-O badges, efficiency meter | **Lab → telemetry HUD** |
| Four-language lesson tabs: JavaScript, Python, C++, Java (JS is editable) | **Lab → Code workbench** |
| Active-line synchronization across languages | **Lab → Code workbench** |
| Continuous drag scrubber with swap/pivot markers | **Lab → Trace position** |
| State persistence (XP, lessons, prediction streak, badges, debug cases) | Zustand `persist` → `localStorage` |
| Student levels and ten achievement badges | **Progress** |
| Any-vs-any race: Bubble, Selection, Insertion, Quick | **Race arena** |
| Shared work-clock race with live counters and winner analysis | **Race arena** |
| Three "find the broken line" challenges | **Debug dojo** |
| Shareable lab and race URLs | **Share trace / Share race** |
| Google sign-in via NextAuth | `/signin` |

The race is measured in **units of work** (comparisons + array writes), not wall-clock
milliseconds. Recursion bookkeeping frames are displayed but do not consume ticks. This makes the
O(n²) vs O(n log n) difference visible without pretending a browser stopwatch is a benchmark.

## Stack

- Next.js 15 (App Router) and React 19
- Zustand 5 with the `persist` middleware
- NextAuth 4 with the Google provider
- Monaco Editor (`@monaco-editor/react`), pinned to `monaco-editor@0.52.2`
- Hand-written CSS design system (mocha / platinum)

## Run locally

```bash
npm install
cp .env.example .env.local
# Fill in Google OAuth values, or leave them blank to use the app without sign-in.
npm run dev
```

Open `http://localhost:3000`.

### Environment variables

| Name | Purpose |
| --- | --- |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `NEXTAUTH_SECRET` | Random session-signing secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Public origin of the deployment (for example `https://algoviz-lab.vercel.app`) |
| `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` | Optional PostHog project token (public). Empty = analytics compiled out of runtime |
| `NEXT_PUBLIC_POSTHOG_HOST` | Optional PostHog ingestion host (`https://us.i.posthog.com` or `https://eu.i.posthog.com`) |

When Google variables are absent, the app runs fully and `/signin` explains the missing
configuration. No client secret is ever exposed to the browser.

### Google Cloud Console

1. Create an OAuth **Web application** client.
2. Add an authorized redirect URI:
   - local: `http://localhost:3000/api/auth/callback/google`
   - production: `https://<your-domain>/api/auth/callback/google`
3. Put the client ID and secret into Vercel → Settings → Environment Variables, not into Git.
4. Set `NEXTAUTH_URL` to the public origin and redeploy.

## Scripts

```bash
npm run dev      # development server
npm run build    # production build
npm start        # production server
npm test         # pure trace / validation tests (node:test)
node posthog-analytics.verify.mjs   # offline analytics consent/privacy tests
```

`npm test` checks all four algorithms on deterministic and random arrays, verifies sorted
invariants, monotonic counters, quick-sort recursion depth, array validation, share-hash
sanitization, snippet anchors and badge logic.

## Architecture

```
app/
  page.js                 application shell
  layout.js               metadata + providers
  api/auth/[...nextauth]  NextAuth Google route
  signin/page.js          configuration-aware sign-in page
  globals.css             design system
  AnalyticsConsent.js     consent-gated analytics bar (hidden until configured)
components/
  LabScreen.js            visualizer, playback, lesson completion, share hash
  CodeWorkbench.js        Monaco, language tabs, active-line sync, sandbox execution
  RaceScreen.js           contenders, work-clock playback, winner analysis
  DebugScreen.js          line-selection debugging challenges
  ProgressScreen.js       levels, stats, badges, local-data controls, profile
lib/
  algorithms.js           instrumentation engine (pure, testable)
  snippets.js             JS/Python/C++/Java snippets + trace anchors
  sandbox.js              worker instrumentation for learner code
  share.js                hash build/parse with validation
store/
  useLearningStore.js     persisted XP / progress / predictions / debug state
tests/
  algorithms.test.mjs     verification suite
```

The built-in algorithm traces and the student sandbox are deliberately separate: built-in traces
are deterministic and fully language-synchronized; sandbox traces are inferred from reads and
writes to support arbitrary learner code.

## Privacy

- Progress lives in this browser's `localStorage`.
- Traces and student code never leave the device.
- Google sign-in identifies the user in the UI; it does not upload learning data.
- PostHog analytics are **opt-in only**: they stay fully off until a token/host is configured
  *and* a visitor clicks "Allow analytics" in the consent bar. URL, referrer, IP and person
  metadata are stripped from every event (`lib/posthog.mjs`), and no analytics bar is shown at
  all when no token is configured.

## Deployment

The project is deployable on Vercel. See [AUDIT.md](./AUDIT.md) for verification evidence and
known limitations.
