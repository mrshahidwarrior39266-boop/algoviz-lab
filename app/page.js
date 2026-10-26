import LandingStory from '@/components/LandingStory';
import RouteForward from '@/components/RouteForward';
import ScrollSequenceAnalytics from '@/components/ScrollSequenceAnalytics';

const ROOMS = [
  {
    href: '/app#lab',
    index: '01',
    title: 'The lab',
    body: 'Scrub a hundred-step trace, edit the JavaScript, run your own version in a sandbox and watch the counters move.',
    cta: 'Open the lab',
  },
  {
    href: '/app#race',
    index: '02',
    title: 'Race arena',
    body: 'Pick any two of Bubble, Selection, Insertion and Quick, run them on one array, and measure the gap in real operations.',
    cta: 'Start a race',
  },
  {
    href: '/app#debug',
    index: '03',
    title: 'Debug dojo',
    body: 'Broken code, one wrong line. Find the line that broke the invariant and learn why it did.',
    cta: 'Find the bug',
  },
  {
    href: '/app#progress',
    index: '04',
    title: 'Progress',
    body: 'XP, student levels and ten badges — saved in this browser, surviving every refresh.',
    cta: 'See my progress',
  },
  {
    href: '/app#lab',
    index: '05',
    title: 'Four languages',
    body: 'JavaScript, Python, C++ and Java side by side, with the active line synced across every translation.',
    cta: 'Compare the tabs',
  },
  {
    href: '/signin',
    index: '06',
    title: 'Sign in',
    body: 'Attach your profile to this browser with Google. Traces never leave the device either way.',
    cta: 'Continue with Google',
  },
];

const NAV_LINKS = [
  { href: '/app#lab', label: 'Lab' },
  { href: '/app#race', label: 'Race arena' },
  { href: '/app#debug', label: 'Debug dojo' },
  { href: '/app#progress', label: 'Progress' },
];

export default function Page() {
  return (
    <div className="landing" id="main-content">
      <RouteForward />

      <header className="landing-nav">
        <a className="landing-brand" href="/" aria-label="AlgoViz home">
          <svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true">
            <rect
              x="1"
              y="1"
              width="38"
              height="38"
              rx="11"
              fill="none"
              stroke="currentColor"
              opacity="0.28"
            />
            <rect x="10" y="20" width="5" height="10" rx="2" fill="#e9e3d7" />
            <rect x="18" y="13" width="5" height="17" rx="2" fill="#d08a5a" />
            <rect x="26" y="8" width="5" height="22" rx="2" fill="#8fae9b" />
          </svg>
          <span>
            <strong>AlgoViz</strong>
            <small>algorithm laboratory</small>
          </span>
        </a>

        <nav className="landing-menu" aria-label="Pages">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
          <a className="landing-signin" href="/signin">
            Sign in
          </a>
        </nav>
      </header>

      <LandingStory />

      <section className="landing-rooms" aria-labelledby="rooms-title">
        <p className="eyebrow">Inside the lab</p>
        <h2 id="rooms-title">Six rooms, one idea: see the work.</h2>
        <ul className="room-grid">
          {ROOMS.map((room) => (
            <li key={`${room.index}-${room.title}`}>
              <a className="room-card" href={room.href}>
                <span className="room-index" aria-hidden="true">
                  {room.index}
                </span>
                <h3>{room.title}</h3>
                <p>{room.body}</p>
                <span className="room-cta">{room.cta} →</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="landing-strip" aria-label="What AlgoViz includes">
        <span>4 sorting algorithms</span>
        <span aria-hidden="true">·</span>
        <span>4 languages</span>
        <span aria-hidden="true">·</span>
        <span>live Big-O telemetry</span>
        <span aria-hidden="true">·</span>
        <span>traces computed on your device</span>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-brand">
          <strong>AlgoViz</strong>
          <span>Sorting, made visible.</span>
        </div>
        <nav aria-label="Footer">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
          <a href="/signin">Sign in</a>
        </nav>
        <p>
          Built for curious students. Traces are generated locally; progress lives in this
          browser.
        </p>
      </footer>

      <ScrollSequenceAnalytics />
    </div>
  );
}
