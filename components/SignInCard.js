'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

const AUTH_ERRORS = {
  Configuration: 'Google sign-in is not fully configured. Check the OAuth client and NextAuth secret.',
  AccessDenied: 'Google access was denied. Try again with an account that can use this app.',
  OAuthSignin: 'Google sign-in could not start. Check the client ID and authorized origins.',
  OAuthCallback: 'Google returned but the callback could not be completed. Check the redirect URI.',
  OAuthAccountNotLinked: 'That Google account is already linked in another way. Try a different account.',
  google: 'Google sign-in was rejected. Check the OAuth client configuration and try again.',
};

export function SignInCard({ configured, callbackUrl }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('error');
    if (!code) return;
    setError(AUTH_ERRORS[code] ?? 'Google sign-in could not be completed. Please try again.');
  }, []);

  async function handleSignIn() {
    if (!configured || loading) return;
    setLoading(true);
    setError('');
    try {
      await signIn('google', { callbackUrl: '/' });
    } catch {
      setLoading(false);
      setError('Google sign-in could not start. Check the OAuth configuration and try again.');
    }
  }

  return (
    <section className="signin-card" aria-labelledby="signin-title">
      <Link href="/" className="signin-back">
        <span aria-hidden="true">←</span> Back to the lab
      </Link>

      <div className="signin-mark" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>

      <p className="eyebrow">Student identity</p>
      <h1 id="signin-title">Sign in with Google.</h1>
      <p className="signin-lede">
        Keep your profile attached to this browser’s progress. Your XP, badges and streak stay
        local — no algorithm trace leaves your device.
      </p>

      <button
        type="button"
        className="google-button"
        onClick={handleSignIn}
        disabled={!configured || loading}
        aria-busy={loading}
      >
        <GoogleMark />
        <span>{loading ? 'Opening Google…' : 'Continue with Google'}</span>
      </button>

      {!configured && (
        <div className="signin-setup" role="status">
          <strong>Google OAuth is not configured on this deployment yet.</strong>
          <p>
            Add <code>GOOGLE_CLIENT_ID</code>, <code>GOOGLE_CLIENT_SECRET</code> and{' '}
            <code>NEXTAUTH_SECRET</code> in Vercel, then redeploy. Authorize this exact callback
            URL in Google Cloud Console:
          </p>
          <code className="callback-uri">{callbackUrl}</code>
        </div>
      )}

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <p className="signin-fineprint">
        Signing in identifies you but does not upload trace data. You can use every lesson without
        an account.
      </p>
    </section>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.57 5.57 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29A7.2 7.2 0 0 1 4.89 12c0-.8.14-1.57.38-2.29V6.62H1.29a12 12 0 0 0 0 10.76l3.98-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A11.99 11.99 0 0 0 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}
