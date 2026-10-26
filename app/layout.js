import './globals.css';
import Providers from './providers.js';
import AnalyticsConsent from '@/components/AnalyticsConsent.js';

const title = 'AlgoViz — Sorting, made visible';
const description =
  'An interactive algorithm laboratory: step, scrub and race four sorting algorithms, inspect live Big-O telemetry, experiment in a code sandbox, and debug broken invariants.';

export const metadata = {
  title: {
    default: title,
    template: '%s · AlgoViz',
  },
  description,
  applicationName: 'AlgoViz',
  keywords: [
    'sorting algorithms',
    'algorithm visualizer',
    'big o notation',
    'bubble sort',
    'quick sort',
    'computer science education',
  ],
  authors: [{ name: 'AlgoViz' }],
  openGraph: {
    title,
    description,
    type: 'website',
    siteName: 'AlgoViz',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#120f0d',
  colorScheme: 'dark',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <Providers>{children}</Providers>
        <AnalyticsConsent />
      </body>
    </html>
  );
}
