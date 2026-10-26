'use client';

import { useEffect, useState } from 'react';
import { CONSENT_UNDECIDED, getAnalyticsClient } from '@/lib/posthog-client.mjs';

const barStyle = {
  position: 'fixed',
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 10,
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 12,
  padding: '16px 20px',
  background: 'rgba(20, 20, 20, 0.92)',
  borderTop: '1px solid rgba(255, 255, 255, 0.14)',
  fontSize: 14,
  lineHeight: 1.4,
};

const buttonStyle = {
  padding: '8px 16px',
  borderRadius: 6,
  border: '1px solid rgba(255, 255, 255, 0.35)',
  background: 'transparent',
  color: 'inherit',
  font: 'inherit',
  cursor: 'pointer',
};

/**
 * Consent gate for analytics. Nothing is captured until a visitor decides;
 * the decision is stored and applied to the existing PostHog client.
 */
export default function AnalyticsConsent() {
  // null until the stored decision is read on the client, so the bar never
  // flashes for visitors who already answered.
  const [decision, setDecision] = useState(null);
  // Without a configured token/host there is nothing to consent to, so the
  // bar stays hidden instead of prompting for analytics that cannot run.
  const ready = getAnalyticsClient().isReady();

  useEffect(() => {
    if (ready) setDecision(getAnalyticsClient().getConsentDecision());
  }, [ready]);

  if (!ready || decision !== CONSENT_UNDECIDED) return null;

  const choose = (granted) => {
    const client = getAnalyticsClient();
    if (granted) client.grantConsent();
    else client.denyConsent();
    setDecision(client.getConsentDecision());
  };

  return (
    <div style={barStyle} role="region" aria-label="Analytics consent">
      <span style={{ flex: '1 1 280px' }}>
        Allow anonymous usage analytics for AlgoViz? No URLs, no personal data.
      </span>
      <button type="button" style={buttonStyle} onClick={() => choose(true)}>
        Allow analytics
      </button>
      <button type="button" style={buttonStyle} onClick={() => choose(false)}>
        Decline
      </button>
    </div>
  );
}
