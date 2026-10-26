'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { ALGORITHMS, ALGORITHM_ORDER } from '@/lib/algorithms';
import { getBadges, getLevel, LEVELS, predictionAccuracy } from '@/lib/progress';
import { useLearningStore } from '@/store/useLearningStore';
import { useState } from 'react';

export default function ProgressScreen({ onOpenLesson }) {
  const state = useLearningStore();
  const [confirmReset, setConfirmReset] = useState(false);

  const level = getLevel(state.xp);
  const lessons = Object.keys(state.completedLessons).length;
  const badges = getBadges(state);
  const unlocked = badges.filter((badge) => badge.unlocked).length;
  const accuracy = predictionAccuracy(state.predictionsCorrect, state.predictionsAttempted);
  const debugCount = Object.keys(state.debugSolved).length;
  const languages = Object.keys(state.languageViews).length;

  return (
    <section className="screen progress-screen" aria-labelledby="progress-title">
      <header className="screen-heading">
        <div className="heading-copy">
          <p className="eyebrow">Learning trail</p>
          <h1 id="progress-title">
            Your progress, in the open<span className="title-period">.</span>
          </h1>
          <p className="screen-lede">
            Levels and badges are earned by finishing traces, making predictions, racing and
            closing bug cases. Everything here is saved in this browser.
          </p>
        </div>
        <div className="heading-actions">
          <span className="xp-large">{state.xp} XP</span>
        </div>
      </header>

      <section className="level-hero" aria-labelledby="level-title">
        <div className="level-main">
          <p className="eyebrow">Level {level.index + 1} of {LEVELS.length}</p>
          <h2 id="level-title">{level.name}</h2>
          <p>{level.blurb}</p>
        </div>
        <div className="level-readout">
          <strong>{state.xp}</strong>
          <span>total XP</span>
        </div>
        <div className="level-track-wrap">
          <div className="level-track" role="img" aria-label={`Level progress ${level.progress} percent`}>
            <span style={{ width: `${level.progress}%` }} />
            {LEVELS.map((tier, index) => (
              <i
                key={tier.name}
                className={index <= level.index ? 'is-reached' : ''}
                style={{ left: `${(index / (LEVELS.length - 1)) * 100}%` }}
                title={`${tier.name} at ${tier.minimum} XP`}
              />
            ))}
          </div>
          <p>
            {level.next
              ? `${level.toNext} XP to ${level.next.name}`
              : 'Top level reached. Keep exploring.'}
          </p>
        </div>
      </section>

      <div className="progress-layout">
        <section className="panel stats-panel" aria-labelledby="stats-title">
          <div className="section-head">
            <div>
              <p className="eyebrow">Telemetry</p>
              <h2 id="stats-title">The shape of your practice</h2>
            </div>
            <span className="badge-count">{unlocked} / {badges.length} badges</span>
          </div>
          <div className="stats-grid">
            <Stat label="Lessons completed" value={`${lessons} / 4`} detail="one per algorithm" />
            <Stat label="Prediction accuracy" value={`${accuracy}%`} detail={`${state.predictionsCorrect} correct`} />
            <Stat label="Best streak" value={state.bestPredictionStreak} detail="predictions in a row" />
            <Stat label="Debug cases" value={`${debugCount} / 3`} detail="broken invariants" />
            <Stat label="Races" value={state.racesCompleted} detail="head-to-head finishes" />
            <Stat
              label="Sandbox runs"
              value={state.sandboxRuns}
              detail={`${languages} language${languages === 1 ? '' : 's'} viewed`}
            />
          </div>
        </section>

        <ProfilePanel />
      </div>

      <section className="panel badges-panel" aria-labelledby="badges-title">
        <div className="section-head">
          <div>
            <p className="eyebrow">Achievements</p>
            <h2 id="badges-title">Badges worth collecting</h2>
          </div>
          <span className="badge-count">{unlocked} unlocked</span>
        </div>
        <div className="badge-grid">
          {badges.map((badge) => (
            <article key={badge.id} className={`badge-card ${badge.unlocked ? 'is-unlocked' : 'is-locked'}`}>
              <span className="badge-mark" aria-hidden="true">{badge.mark}</span>
              <div>
                <h3>{badge.name}</h3>
                <p>{badge.description}</p>
              </div>
              <span className="badge-status">{badge.unlocked ? 'earned' : 'locked'}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="panel lessons-panel" aria-labelledby="lessons-title">
        <div className="section-head">
          <div>
            <p className="eyebrow">Curriculum</p>
            <h2 id="lessons-title">Four algorithms, four mental models</h2>
          </div>
        </div>
        <div className="lesson-progress-grid">
          {ALGORITHM_ORDER.map((id, index) => {
            const meta = ALGORITHMS[id];
            const isDone = Boolean(state.completedLessons[id]);
            return (
              <article key={id} className={`lesson-progress-card ${isDone ? 'is-done' : ''}`}>
                <div className="lesson-progress-head">
                  <span className="lesson-number">{String(index + 1).padStart(2, '0')}</span>
                  <span className={`lesson-state ${isDone ? 'is-done' : ''}`}>
                    {isDone ? 'completed ✓' : 'not started'}
                  </span>
                </div>
                <h3>{meta.name}</h3>
                <p>{meta.kicker} · {meta.complexity.average}</p>
                <button type="button" className="btn btn-quiet btn-small" onClick={() => onOpenLesson(id)}>
                  {isDone ? 'Review lesson' : 'Open lesson'}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel data-panel" aria-labelledby="data-title">
        <div>
          <p className="eyebrow">Your data</p>
          <h2 id="data-title">Local by design</h2>
          <p>
            XP, badges, streaks and lesson completion are stored in <code>localStorage</code> on this
            device. There is no server database and no trace upload. Clearing site data resets the
            trail.
          </p>
        </div>
        <div className="data-actions">
          {confirmReset ? (
            <>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  state.resetProgress();
                  setConfirmReset(false);
                }}
              >
                Yes, reset everything
              </button>
              <button type="button" className="btn btn-quiet" onClick={() => setConfirmReset(false)}>
                Keep my progress
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-outline" onClick={() => setConfirmReset(true)}>
              Reset progress
            </button>
          )}
        </div>
      </section>
    </section>
  );
}

function Stat({ label, value, detail }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

function ProfilePanel() {
  return (
    <section className="panel profile-panel" aria-labelledby="profile-title">
      <div className="section-head">
        <div>
          <p className="eyebrow">Student profile</p>
          <h2 id="profile-title">Who is learning?</h2>
        </div>
      </div>
      <SessionProfile />
    </section>
  );
}

function SessionProfile() {
  const { data, status } = useSession();
  if (status === 'loading') return <p className="profile-note">Checking your session…</p>;
  if (status !== 'authenticated') return <SignedOutProfile />;

  const user = data.user;
  return (
    <div className="profile-card">
      {user?.image ? (
        <img
          src={user.image}
          alt=""
          width="56"
          height="56"
          className="profile-avatar"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="profile-avatar profile-fallback" aria-hidden="true">
          {(user?.name ?? '?').slice(0, 1)}
        </span>
      )}
      <div className="profile-copy">
        <strong>{user?.name ?? 'Student'}</strong>
        <span>{user?.email}</span>
        <small>Signed in with Google · progress stays local</small>
      </div>
      <button type="button" className="btn btn-quiet btn-small" onClick={() => signOut({ callbackUrl: '/' })}>
        Sign out
      </button>
    </div>
  );
}

function SignedOutProfile() {
  return (
    <div className="profile-signed-out">
      <div className="profile-glyph" aria-hidden="true">G</div>
      <div>
        <strong>Bring your Google identity</strong>
        <p>
          Sign-in identifies you on this device. Progress is not uploaded or synced between
          browsers yet.
        </p>
        <Link href="/signin" className="btn btn-outline btn-small">
          Continue with Google
        </Link>
      </div>
    </div>
  );
}
