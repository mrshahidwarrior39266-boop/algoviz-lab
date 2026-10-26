'use client';

/**
 * The one PostHog client for the browser. Configuration is inlined by Next.js
 * from NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN / NEXT_PUBLIC_POSTHOG_HOST; when either
 * is unset the client stays a no-op.
 */

import posthog from 'posthog-js';
import { createAnalyticsClient } from './posthog.mjs';

// Re-exported so consumers have one import site for client + consent states.
export {
  CONSENT_GRANTED,
  CONSENT_DENIED,
  CONSENT_UNDECIDED,
  CONSENT_STORAGE_KEY,
} from './posthog.mjs';

let client = null;

export function getAnalyticsClient() {
  if (!client) {
    client = createAnalyticsClient({
      env: {
        NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN,
        NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      },
      sdk: posthog,
      storage: typeof window === 'undefined' ? null : window.localStorage,
    });
  }
  return client;
}
