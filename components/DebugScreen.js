'use client';

import { useState } from 'react';
import { DEBUG_CHALLENGES } from '@/lib/debugChallenges';
import { useLearningStore } from '@/store/useLearningStore';

export default function DebugScreen() {
  const [challengeId, setChallengeId] = useState(DEBUG_CHALLENGES[0].id);
  const [selectedLine, setSelectedLine] = useState(null);
  const [result, setResult] = useState('idle');
  const [showHint, setShowHint] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const debugSolved = useLearningStore((state) => state.debugSolved);
  const solveDebug = useLearningStore((state) => state.solveDebug);

  const challenge = DEBUG_CHALLENGES.find((item) => item.id === challengeId) ?? DEBUG_CHALLENGES[0];
  const solved = Boolean(debugSolved[challenge.id]) || result === 'correct';
  const solvedCount = Object.keys(debugSolved).length;

  function selectChallenge(id) {
    setChallengeId(id);
    setSelectedLine(null);
    setResult('idle');
    setShowHint(false);
    setAttempts(0);
  }

  function checkLine() {
    if (!selectedLine || solved) return;
    if (selectedLine === challenge.bugLine) {
      setResult('correct');
      solveDebug(challenge.id);
    } else {
      setResult('wrong');
      setAttempts((value) => value + 1);
    }
  }

  return (
    <section className="screen debug-screen" aria-labelledby="debug-title">
      <header className="screen-heading">
        <div className="heading-copy">
          <p className="eyebrow">Debug dojo</p>
          <h1 id="debug-title">
            Break it. Then find it<span className="title-period">.</span>
          </h1>
          <p className="screen-lede">
            Every broken sort still looks plausible. Read the invariant, inspect the code, and
            choose the single line that makes the promise false.
          </p>
          <div className="heading-meta">
            <span className="complexity-chip">{solvedCount} / {DEBUG_CHALLENGES.length} solved</span>
            <span className="kicker-chip">+25 XP each</span>
          </div>
        </div>
      </header>

      <div className="challenge-list" aria-label="Debugging challenges">
        {DEBUG_CHALLENGES.map((item, index) => {
          const isSolved = Boolean(debugSolved[item.id]);
          return (
            <button
              key={item.id}
              type="button"
              className={`challenge-card ${item.id === challengeId ? 'is-active' : ''} ${isSolved ? 'is-solved' : ''}`}
              aria-pressed={item.id === challengeId}
              onClick={() => selectChallenge(item.id)}
            >
              <span className="challenge-number">{String(index + 1).padStart(2, '0')}</span>
              <span className="challenge-copy">
                <strong>{item.title}</strong>
                <small>
                  {item.algorithm} · {item.difficulty}
                </small>
              </span>
              <span className="challenge-state">{isSolved ? 'solved ✓' : 'open'}</span>
            </button>
          );
        })}
      </div>

      <div className="debug-grid">
        <section className="panel invariant-panel" aria-labelledby="invariant-title">
          <p className="eyebrow">The invariant</p>
          <h2 id="invariant-title">What must stay true?</h2>
          <p className="invariant-text">{challenge.invariant}</p>

          <div className="prompt-block">
            <span className="prompt-label">Your task</span>
            <p>{challenge.prompt}</p>
          </div>

          <div className="debug-progress">
            <div>
              <span>Attempts</span>
              <strong>{attempts}</strong>
            </div>
            <div>
              <span>Reward</span>
              <strong>+{challenge.xp} XP</strong>
            </div>
            <div>
              <span>Difficulty</span>
              <strong>{challenge.difficulty}</strong>
            </div>
          </div>

          <div className="debug-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={checkLine}
              disabled={!selectedLine || solved}
            >
              {solved ? 'Invariant found ✓' : 'Check selected line'}
            </button>
            <button type="button" className="btn btn-quiet" onClick={() => setShowHint((value) => !value)}>
              {showHint ? 'Hide hint' : 'Need a hint?'}
            </button>
          </div>

          {showHint && !solved && (
            <p className="hint-box" role="status">
              <strong>Hint.</strong> {challenge.hint}
            </p>
          )}

          {result === 'wrong' && (
            <p className="debug-feedback is-wrong" role="alert">
              <strong>Not that line.</strong> It does something legitimate here. Re-read the
              invariant and follow the data on the next pass.
            </p>
          )}

          {solved && (
            <div className="debug-feedback is-correct" role="status">
              <strong>Case closed.</strong>
              <p>{challenge.explanation}</p>
            </div>
          )}
        </section>

        <section className="panel code-inspection" aria-labelledby="inspect-title">
          <header className="inspect-head">
            <div>
              <p className="eyebrow">Evidence</p>
              <h2 id="inspect-title">Click the line that breaks it</h2>
            </div>
            <span className="inspect-file">challenge.js</span>
          </header>

          <ol className="bug-code">
            {challenge.code.map((line, index) => {
              const lineNumber = index + 1;
              const isSelected = selectedLine === lineNumber;
              const isBug = solved && lineNumber === challenge.bugLine;
              return (
                <li key={`${challenge.id}-${lineNumber}`}>
                  <button
                    type="button"
                    className={`bug-line ${isSelected ? 'is-selected' : ''} ${isBug ? 'is-bug' : ''}`}
                    aria-pressed={isSelected}
                    aria-label={`Select line ${lineNumber}: ${line.trim() || 'blank line'}`}
                    onClick={() => {
                      if (solved) return;
                      setSelectedLine(lineNumber);
                      setResult('idle');
                    }}
                    disabled={solved}
                  >
                    <span className="bug-line-number">{lineNumber}</span>
                    <code>{line || ' '}</code>
                    {isBug && <span className="bug-tag">bug</span>}
                  </button>
                </li>
              );
            })}
          </ol>

          <p className="inspect-foot">
            {solved
              ? `Line ${challenge.bugLine} is the fault line. The rest of the function can stay.`
              : selectedLine
                ? `Line ${selectedLine} selected. Check it against the invariant.`
                : 'Select one line, then check your answer.'}
          </p>
        </section>
      </div>
    </section>
  );
}
