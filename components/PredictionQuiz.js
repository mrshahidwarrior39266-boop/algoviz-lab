'use client';

import { useState } from 'react';
import { useLearningStore } from '@/store/useLearningStore';
import { predictionAccuracy } from '@/lib/progress';

export default function PredictionQuiz({ trace, stepIndex, algorithmId, custom, onFindComparison }) {
  const step = trace.steps[stepIndex] ?? trace.steps[0];
  const key = `${algorithmId}:${stepIndex}`;
  const predictions = useLearningStore((state) => state.predictions);
  const streak = useLearningStore((state) => state.predictionStreak);
  const best = useLearningStore((state) => state.bestPredictionStreak);
  const correctTotal = useLearningStore((state) => state.predictionsCorrect);
  const attemptedTotal = useLearningStore((state) => state.predictionsAttempted);
  const recordPrediction = useLearningStore((state) => state.recordPrediction);

  const [awardedKey, setAwardedKey] = useState(null);
  const answered = predictions[key];
  const isComparison = step.action === 'compare' && step.indices.length >= 2;
  const willSwap = trace.steps[stepIndex + 1]?.action === 'swap';
  const accuracy = predictionAccuracy(correctTotal, attemptedTotal);

  function answer(choice) {
    if (!isComparison || answered) return;
    const correct = choice === willSwap;
    const result = recordPrediction({ key, correct });
    if (result.awarded && correct) setAwardedKey(key);
  }

  return (
    <section className="panel quiz-panel" aria-labelledby="quiz-title">
      <header className="quiz-head">
        <div>
          <p className="eyebrow">Prediction checkpoint</p>
          <h2 id="quiz-title">Will this comparison swap?</h2>
        </div>
        <div className="streak-badge" title={`Best streak: ${best}`}>
          <span aria-hidden="true">↯</span>
          <strong>{streak}</strong>
          <small>streak</small>
        </div>
      </header>

      {custom ? (
        <p className="quiz-idle">
          Predictions run on the lesson trace. Return to the lesson code to keep your streak.
        </p>
      ) : isComparison ? (
        <>
          <div className="quiz-pair" aria-label="Elements being compared">
            <span className="comparison-token">
              a[{step.indices[0]}] = <strong>{step.array[step.indices[0]]}</strong>
            </span>
            <span className="comparison-vs">vs</span>
            <span className="comparison-token">
              a[{step.indices[1]}] = <strong>{step.array[step.indices[1]]}</strong>
            </span>
          </div>

          <div className="quiz-options">
            <button
              type="button"
              className={`quiz-option ${answered ? (willSwap ? 'is-answer' : '') : ''}`}
              onClick={() => answer(true)}
              disabled={Boolean(answered)}
            >
              <span className="option-key">Y</span>
              Yes, swap
            </button>
            <button
              type="button"
              className={`quiz-option ${answered ? (!willSwap ? 'is-answer' : '') : ''}`}
              onClick={() => answer(false)}
              disabled={Boolean(answered)}
            >
              <span className="option-key">N</span>
              No, keep order
            </button>
          </div>

          {answered ? (
            <p className={`quiz-feedback ${answered.correct ? 'is-correct' : 'is-wrong'}`} role="status">
              {answered.correct ? (
                <>
                  <strong>Correct.</strong> {willSwap ? 'This pair swaps next.' : 'This pair stays put.'}
                  {awardedKey === key ? (
                    <span className="xp-tag">+10 XP</span>
                  ) : (
                    <span className="xp-tag is-muted">answered earlier</span>
                  )}
                </>
              ) : (
                <>
                  <strong>Not quite.</strong>{' '}
                  {willSwap
                    ? 'The next frame is a swap — watch the two bars trade places.'
                    : 'The comparison fails, so the next frame does not swap this pair.'}
                </>
              )}
            </p>
          ) : (
            <p className="quiz-hint">
              First answer on each comparison earns 10 XP. Current accuracy {accuracy}%.
            </p>
          )}
        </>
      ) : (
        <div className="quiz-idle">
          <p>
            {step.action === 'done'
              ? 'The trace is complete. Scrub back to a comparison to practice a prediction.'
              : 'Pause on a comparison step to make a prediction.'}
          </p>
          <button type="button" className="btn btn-quiet btn-small" onClick={onFindComparison}>
            Find next comparison
          </button>
        </div>
      )}

      <footer className="quiz-foot">
        <span>
          accuracy <strong>{accuracy}%</strong>
        </span>
        <span>
          best streak <strong>{best}</strong>
        </span>
        <span>
          answered <strong>{attemptedTotal}</strong>
        </span>
      </footer>
    </section>
  );
}
