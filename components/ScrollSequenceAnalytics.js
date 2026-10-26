'use client';

import { useEffect, useRef } from 'react';
import { getAnalyticsClient } from '@/lib/posthog-client.mjs';
import { createScrollSequenceTracker, readScrollDepth } from '@/lib/scroll-sequence.mjs';

/**
 * Invisible companion to <ScrollSequence />: reports how far a visitor scrolls
 * through the sequence. Sends nothing unless consent was granted.
 */
export default function ScrollSequenceAnalytics() {
  const tracker = useRef(null);

  useEffect(() => {
    const client = getAnalyticsClient();
    const reducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const sequenceTracker = createScrollSequenceTracker({
      capture: (event, properties) => client.capture(event, properties),
      reducedMotion,
    });
    tracker.current = sequenceTracker;

    const measure = () => {
      sequenceTracker.track(
        readScrollDepth(
          window.scrollY,
          window.innerHeight,
          document.documentElement.scrollHeight
        )
      );
    };

    measure();
    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);

    return () => {
      window.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
      tracker.current = null;
    };
  }, []);

  return null;
}
