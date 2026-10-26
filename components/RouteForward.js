'use client';

import { useEffect } from 'react';

const APP_TABS = new Set(['lab', 'race', 'debug', 'progress']);

/**
 * Share links created before the app moved to `/app` point at `/#lab?...`.
 * The landing page lives at `/` now, so those hashes are forwarded once on
 * mount instead of silently dropping the shared state.
 */
export default function RouteForward() {
  useEffect(() => {
    const forward = () => {
      const match = /^#([a-z]+)/.exec(window.location.hash || '');
      if (match && APP_TABS.has(match[1])) {
        window.location.replace(`/app${window.location.hash}`);
      }
    };

    forward();
    // A shared link opened while the landing page is already loaded only
    // changes the hash, which never remounts this component — listen for it.
    window.addEventListener('hashchange', forward);
    return () => window.removeEventListener('hashchange', forward);
  }, []);

  return null;
}
