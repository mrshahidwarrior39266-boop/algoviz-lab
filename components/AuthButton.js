'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';

export default function AuthButton() {
  const { data, status } = useSession();

  if (status === 'loading') {
    return <span className="auth-skeleton" aria-label="Checking sign-in status" />;
  }

  if (status !== 'authenticated') {
    return (
      <Link href="/signin" className="auth-chip">
        <span className="auth-dot" aria-hidden="true" />
        <span>Sign in</span>
      </Link>
    );
  }

  const user = data?.user;
  const initial = (user?.name || user?.email || '?').slice(0, 1).toUpperCase();

  return (
    <div className="auth-user">
      {user?.image ? (
        <img
          src={user.image}
          alt=""
          width="28"
          height="28"
          className="auth-avatar"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="auth-avatar auth-avatar-fallback" aria-hidden="true">
          {initial}
        </span>
      )}
      <span className="auth-name">{user?.name ?? user?.email ?? 'Student'}</span>
      <button
        type="button"
        className="auth-signout"
        onClick={() => signOut({ callbackUrl: '/' })}
        title="Sign out"
        aria-label="Sign out"
      >
        ↗
      </button>
    </div>
  );
}
