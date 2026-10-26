'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ALGORITHMS,
  ALGORITHM_ORDER,
  DEFAULT_ARRAY,
  buildTrace,
} from '@/lib/algorithms';
import { buildLabHash, currentShareUrl, replaceHash } from '@/lib/share';
import { copyText } from '@/lib/clipboard';
import { useLearningStore } from '@/store/useLearningStore';
import ArrayInputBar from './ArrayInputBar';
import TelemetryHUD from './TelemetryHUD';
import ArrayVisualizer from './ArrayVisualizer';
import StepTimeline from './StepTimeline';
import TransportControls from './TransportControls';
import CodeWorkbench from './CodeWorkbench';
import PredictionQuiz from './PredictionQuiz';

const LANGUAGE_IDS = new Set(['js', 'python', 'cpp', 'java']);

export default function LabScreen({ active, initial, ready, seed }) {
  const [algorithmId, setAlgorithmId] = useState('bubble');
  const [array, setArray] = useState(DEFAULT_ARRAY);
  const [step, setStep] = useState(0);
  const [language, setLanguage] = useState('js');
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [customTrace, setCustomTrace] = useState(null);
  const [shareState, setShareState] = useState('idle');

  const completedLessons = useLearningStore((state) => state.completedLessons);
  const completed = Boolean(completedLessons[algorithmId]);
  const completeLesson = useLearningStore((state) => state.completeLesson);

  const meta = ALGORITHMS[algorithmId];
  const lessonIndex = ALGORITHM_ORDER.indexOf(algorithmId);
  const lessonTrace = useMemo(() => buildTrace(algorithmId, array), [algorithmId, array]);
  const activeTrace = customTrace ?? lessonTrace;
  const total = activeTrace.steps.length;
  const displayStep = Math.min(Math.max(step, 0), Math.max(0, total - 1));
  const atEnd = displayStep >= total - 1;

  useEffect(() => {
    if (!initial) return;
    if (initial.algorithm && ALGORITHMS[initial.algorithm]) setAlgorithmId(initial.algorithm);
    if (Array.isArray(initial.array) && initial.array.length) setArray(initial.array);
    if (Number.isInteger(initial.step)) setStep(initial.step);
    if (LANGUAGE_IDS.has(initial.language)) setLanguage(initial.language);
    setCustomTrace(null);
    setPlaying(false);
    // `seed` intentionally re-applies a hash even when the values look identical.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial, seed]);

  useEffect(() => {
    if (step > activeTrace.steps.length - 1) setStep(activeTrace.steps.length - 1);
  }, [activeTrace.steps.length, step]);

  useEffect(() => {
    if (!active || !playing) return;
    if (displayStep >= total - 1) {
      setPlaying(false);
      return;
    }
    const delay = Math.max(45, 620 / speed);
    const timer = setTimeout(() => {
      setStep((value) => Math.min(value + 1, total - 1));
    }, delay);
    return () => clearTimeout(timer);
  }, [active, playing, displayStep, speed, total]);

  useEffect(() => {
    if (!active) setPlaying(false);
  }, [active]);

  useEffect(() => {
    if (!active || !ready || customTrace) return;
    const hash = buildLabHash({ algorithm: algorithmId, array, step: displayStep, language });
    const timer = setTimeout(() => replaceHash(hash), 120);
    return () => clearTimeout(timer);
  }, [active, ready, algorithmId, array, language, displayStep, customTrace]);

  useEffect(() => {
    if (!active) return;
    function onKeyDown(event) {
      const target = event.target;
      const tag = target?.tagName?.toLowerCase();
      if (
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        target?.isContentEditable ||
        target?.closest?.('.monaco-editor')
      ) {
        return;
      }
      if (event.code === 'Space') {
        event.preventDefault();
        togglePlayback();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        setPlaying(false);
        setStep((value) => Math.min(value + 1, total - 1));
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setPlaying(false);
        setStep((value) => Math.max(value - 1, 0));
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active, total, playing, displayStep]);

  useEffect(() => {
    if (shareState === 'idle') return;
    const timer = setTimeout(() => setShareState('idle'), 2200);
    return () => clearTimeout(timer);
  }, [shareState]);

  function togglePlayback() {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (displayStep >= total - 1) setStep(0);
    setPlaying(true);
  }

  function changeAlgorithm(nextAlgorithm) {
    if (nextAlgorithm === algorithmId) return;
    setAlgorithmId(nextAlgorithm);
    setStep(0);
    setPlaying(false);
    setCustomTrace(null);
  }

  function changeArray(nextArray) {
    setArray(nextArray);
    setStep(0);
    setPlaying(false);
    setCustomTrace(null);
  }

  function handleStep(nextStep) {
    setStep(Math.min(Math.max(nextStep, 0), total - 1));
  }

  function handleCustomTrace(trace) {
    setCustomTrace(trace);
    setStep(0);
    setPlaying(false);
  }

  function resetCustomTrace() {
    setCustomTrace(null);
    setStep(0);
    setPlaying(false);
  }

  function findComparison() {
    setPlaying(false);
    for (let index = displayStep + 1; index < activeTrace.steps.length; index += 1) {
      if (activeTrace.steps[index].action === 'compare') {
        setStep(index);
        return;
      }
    }
    const first = activeTrace.steps.findIndex((item) => item.action === 'compare');
    if (first >= 0) setStep(first);
  }

  function claimLesson() {
    if (completed || !atEnd) return;
    completeLesson(algorithmId);
  }

  async function shareTrace() {
    if (customTrace) return;
    const hash = buildLabHash({ algorithm: algorithmId, array, step: displayStep, language });
    const copied = await copyText(currentShareUrl(hash));
    setShareState(copied ? 'copied' : 'failed');
  }

  return (
    <section className="screen lab-screen" aria-labelledby="lab-title">
      <header className="screen-heading lab-heading">
        <div className="heading-copy">
          <p className="eyebrow">
            Algorithm lab · lesson {String(lessonIndex + 1).padStart(2, '0')} of{' '}
            {String(ALGORITHM_ORDER.length).padStart(2, '0')}
          </p>
          <h1 id="lab-title">
            {meta.name}
            <span className="title-period">.</span>
          </h1>
          <p className="screen-lede">{meta.tagline}</p>
          <div className="heading-meta">
            <span className="complexity-chip">{meta.complexity.average} average</span>
            <span className={`stability-chip ${meta.stable ? 'is-stable' : ''}`}>
              {meta.stable ? 'stable' : 'unstable'}
            </span>
            <span className="kicker-chip">{meta.kicker}</span>
          </div>
        </div>

        <div className="heading-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={shareTrace}
            disabled={Boolean(customTrace)}
            title={customTrace ? 'Return to the lesson trace to share' : 'Copy a link to this exact step'}
          >
            {shareState === 'copied' ? 'Link copied ✓' : shareState === 'failed' ? 'Copy failed' : 'Share trace'}
          </button>
          <button
            type="button"
            className={`btn claim-button ${completed ? 'is-complete' : ''}`}
            onClick={claimLesson}
            disabled={completed || !atEnd}
            title={!atEnd ? 'Play to the final step to claim this lesson' : undefined}
          >
            {completed ? 'Lesson completed ✓' : atEnd ? 'Claim 60 XP' : 'Finish trace to claim'}
          </button>
        </div>
      </header>

      <div className="algorithm-switcher" aria-label="Choose an algorithm">
        {ALGORITHM_ORDER.map((id, index) => {
          const item = ALGORITHMS[id];
          const isActive = id === algorithmId;
          const isDone = Boolean(completedLessons[id]);
          return (
            <button
              key={id}
              type="button"
              className={`algo-option ${isActive ? 'is-active' : ''}`}
              aria-pressed={isActive}
              onClick={() => changeAlgorithm(id)}
            >
              <span className="algo-number">{String(index + 1).padStart(2, '0')}</span>
              <span className="algo-name">{item.name}</span>
              <span className="algo-time">{item.complexity.average}</span>
              {isDone && <span className="algo-done" aria-label="completed">✓</span>}
            </button>
          );
        })}
      </div>

      <div className="lab-grid">
        <div className="stage-column">
          <section className="panel stage-panel" aria-label="Algorithm visualizer and telemetry">
            <ArrayInputBar values={array} onApply={changeArray} />
            <TelemetryHUD trace={activeTrace} stepIndex={displayStep} algorithmId={algorithmId} />
            <ArrayVisualizer trace={activeTrace} stepIndex={displayStep} />
            <StepTimeline
              trace={activeTrace}
              stepIndex={displayStep}
              onStep={handleStep}
              onScrubStart={() => setPlaying(false)}
            />
            <TransportControls
              playing={playing}
              onToggle={togglePlayback}
              onStep={handleStep}
              onReset={() => {
                setPlaying(false);
                setStep(0);
              }}
              speed={speed}
              onSpeed={setSpeed}
              stepIndex={displayStep}
              total={total}
            />
            {customTrace && (
              <div className={`stage-custom-banner ${customTrace.sorted ? 'is-sorted' : 'is-unsorted'}`}>
                <span className="custom-dot" aria-hidden="true" />
                You are viewing <strong>your code’s trace</strong>. Counters are inferred from reads
                and writes.
              </div>
            )}
          </section>
        </div>

        <div className="lab-side">
          <CodeWorkbench
            algorithmId={algorithmId}
            language={language}
            onLanguageChange={setLanguage}
            trace={lessonTrace}
            stepIndex={Math.min(displayStep, lessonTrace.steps.length - 1)}
            customTrace={customTrace}
            onCustomTrace={handleCustomTrace}
            onResetCustom={resetCustomTrace}
            array={array}
            playing={playing}
          />
          <PredictionQuiz
            trace={lessonTrace}
            stepIndex={Math.min(displayStep, lessonTrace.steps.length - 1)}
            algorithmId={algorithmId}
            custom={Boolean(customTrace)}
            onFindComparison={findComparison}
          />
        </div>
      </div>

      <section className="panel lesson-notes" aria-labelledby="notes-title">
        <div className="lesson-notes-copy">
          <p className="eyebrow">Lesson notes</p>
          <h2 id="notes-title">What is worth noticing</h2>
          <p className="lesson-description">{meta.description}</p>
          <ul className="watch-list">
            {meta.watch.map((item, index) => (
              <li key={item}>
                <span className="watch-index">{String(index + 1).padStart(2, '0')}</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <aside className="complexity-card" aria-label="Complexity summary">
          <div className="complexity-card-head">
            <span>Complexity profile</span>
            <span className="complexity-notation">{meta.complexity.worst}</span>
          </div>
          <dl className="complexity-list">
            <div>
              <dt>Best</dt>
              <dd>{meta.complexity.best}</dd>
            </div>
            <div>
              <dt>Average</dt>
              <dd>{meta.complexity.average}</dd>
            </div>
            <div>
              <dt>Worst</dt>
              <dd>{meta.complexity.worst}</dd>
            </div>
            <div>
              <dt>Aux space</dt>
              <dd>{meta.complexity.space}</dd>
            </div>
            <div>
              <dt>Stability</dt>
              <dd>{meta.stable ? 'Stable' : 'Unstable'}</dd>
            </div>
          </dl>
          <p className="interview-note">
            <span>Interview lens</span>
            {meta.interview}
          </p>
        </aside>
      </section>

      <p className="keyboard-hint">
        Shortcuts: <kbd>Space</kbd> play / pause · <kbd>←</kbd> <kbd>→</kbd> step · drag the
        scrubber for instant travel
      </p>
    </section>
  );
}
