'use client';

import { useEffect, useMemo, useState } from 'react';
import { ALGORITHMS, ALGORITHM_ORDER, DEFAULT_ARRAY, buildTrace } from '@/lib/algorithms';
import { buildRaceHash, currentShareUrl, replaceHash } from '@/lib/share';
import { copyText } from '@/lib/clipboard';
import { useLearningStore } from '@/store/useLearningStore';
import ArrayInputBar from './ArrayInputBar';
import Bars from './Bars';

const SPEEDS = [0.5, 1, 2, 4];

function measuredWork(step) {
  return (step?.comparisons ?? 0) + (step?.writes ?? 0);
}

function stepIndexForWork(trace, work) {
  let index = 0;
  for (let cursor = 0; cursor < trace.steps.length; cursor += 1) {
    const stepWork = measuredWork(trace.steps[cursor]);
    if (stepWork > work) break;
    if (stepWork === work) return cursor;
    index = cursor;
  }
  return index;
}

export default function RaceScreen({ active, initial, ready, seed }) {
  const [contenderA, setContenderA] = useState('bubble');
  const [contenderB, setContenderB] = useState('quick');
  const [array, setArray] = useState(DEFAULT_ARRAY);
  const [tick, setTick] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [finished, setFinished] = useState(false);
  const [started, setStarted] = useState(false);
  const [shareState, setShareState] = useState('idle');
  const recordRace = useLearningStore((state) => state.recordRace);

  const traceA = useMemo(() => buildTrace(contenderA, array), [contenderA, array]);
  const traceB = useMemo(() => buildTrace(contenderB, array), [contenderB, array]);
  const totalWorkA = measuredWork(traceA.steps[traceA.steps.length - 1]);
  const totalWorkB = measuredWork(traceB.steps[traceB.steps.length - 1]);
  const maxWork = Math.max(totalWorkA, totalWorkB);
  const displayedTick = Math.min(Math.max(tick, 0), maxWork);
  const atEnd = displayedTick >= maxWork;
  const progressA = Math.min(100, Math.round((displayedTick / Math.max(1, totalWorkA)) * 100));
  const progressB = Math.min(100, Math.round((displayedTick / Math.max(1, totalWorkB)) * 100));
  const stepA = traceA.steps[stepIndexForWork(traceA, displayedTick)];
  const stepB = traceB.steps[stepIndexForWork(traceB, displayedTick)];
  const winner =
    finished && totalWorkA !== totalWorkB
      ? totalWorkA < totalWorkB
        ? 'a'
        : 'b'
      : finished
        ? 'tie'
        : null;

  useEffect(() => {
    if (!initial) return;
    if (ALGORITHMS[initial.c1]) setContenderA(initial.c1);
    if (ALGORITHMS[initial.c2]) setContenderB(initial.c2);
    if (Array.isArray(initial.array) && initial.array.length) setArray(initial.array);
    if (Number.isFinite(initial.speed)) setSpeed(initial.speed);
    setTick(Number.isInteger(initial.tick) ? initial.tick : 0);
    setPlaying(false);
    setFinished(false);
    setStarted(false);
    // `seed` lets an identical-looking shared URL still reset the arena.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial, seed]);

  useEffect(() => {
    if (tick > maxWork) setTick(maxWork);
  }, [maxWork, tick]);

  useEffect(() => {
    if (!active || !playing) return;
    if (displayedTick >= maxWork) {
      setPlaying(false);
      return;
    }
    const delay = Math.max(22, 70 / speed);
    const timer = setTimeout(() => setTick((value) => Math.min(value + 1, maxWork)), delay);
    return () => clearTimeout(timer);
  }, [active, playing, displayedTick, maxWork, speed]);

  useEffect(() => {
    if (!active) setPlaying(false);
  }, [active]);

  useEffect(() => {
    if (displayedTick < maxWork) {
      if (finished) setFinished(false);
      return;
    }
    if (finished || !started) return;
    setFinished(true);
    setPlaying(false);
    recordRace();
  }, [displayedTick, maxWork, finished, started, recordRace]);

  useEffect(() => {
    // A shared link may point at the final work tick. Show the result without
    // awarding race XP unless the visitor actually ran the race.
    if (!started && displayedTick >= maxWork && displayedTick > 0 && !finished) {
      setFinished(true);
    }
  }, [started, displayedTick, maxWork, finished]);

  useEffect(() => {
    if (!active || !ready) return;
    const hash = buildRaceHash({
      c1: contenderA,
      c2: contenderB,
      array,
      tick: displayedTick,
      speed,
    });
    const timer = setTimeout(() => replaceHash(hash), 120);
    return () => clearTimeout(timer);
  }, [active, ready, contenderA, contenderB, array, displayedTick, speed]);

  useEffect(() => {
    if (shareState === 'idle') return;
    const timer = setTimeout(() => setShareState('idle'), 2200);
    return () => clearTimeout(timer);
  }, [shareState]);

  function resetRace() {
    setTick(0);
    setPlaying(false);
    setFinished(false);
    setStarted(false);
  }

  function changeContender(side, value) {
    if (side === 'a') setContenderA(value);
    else setContenderB(value);
    resetRace();
  }

  function changeArray(values) {
    setArray(values);
    resetRace();
  }

  function toggleRace() {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (atEnd) {
      setTick(0);
      setFinished(false);
    }
    setStarted(true);
    setPlaying(true);
  }

  async function shareRace() {
    const hash = buildRaceHash({
      c1: contenderA,
      c2: contenderB,
      array,
      tick: displayedTick,
      speed,
    });
    const copied = await copyText(currentShareUrl(hash));
    setShareState(copied ? 'copied' : 'failed');
  }

  return (
    <section className="screen race-screen" aria-labelledby="race-title">
      <header className="screen-heading">
        <div className="heading-copy">
          <p className="eyebrow">Race arena</p>
          <h1 id="race-title">
            Two algorithms. One array<span className="title-period">.</span>
          </h1>
          <p className="screen-lede">
            Put any two sorting strategies on the same input. Watch their operation counts diverge
            in real time — then read the receipts.
          </p>
          <div className="heading-meta">
            <span className="complexity-chip">event-for-event race</span>
            <span className="kicker-chip">same input · honest counters</span>
          </div>
        </div>
        <div className="heading-actions">
          <button type="button" className="btn btn-outline" onClick={shareRace}>
            {shareState === 'copied' ? 'Link copied ✓' : shareState === 'failed' ? 'Copy failed' : 'Share race'}
          </button>
        </div>
      </header>

      <section className="panel race-setup" aria-label="Race configuration">
        <div className="contender-pickers">
          <ContenderPicker
            side="a"
            label="Contender one"
            value={contenderA}
            onChange={(value) => changeContender('a', value)}
          />
          <span className="versus" aria-hidden="true">
            vs
          </span>
          <ContenderPicker
            side="b"
            label="Contender two"
            value={contenderB}
            onChange={(value) => changeContender('b', value)}
          />
        </div>

        <ArrayInputBar values={array} onApply={changeArray} compact />

        <div className="race-controls">
          <button type="button" className="btn btn-primary race-start" onClick={toggleRace}>
            {playing ? 'Pause race' : atEnd ? 'Race again' : 'Start race'}
          </button>
          <button type="button" className="btn btn-quiet" onClick={resetRace} disabled={displayedTick === 0}>
            Reset
          </button>
          <label className="speed-control">
            <span>speed</span>
            <select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}>
              {SPEEDS.map((value) => (
                <option key={value} value={value}>
                  {value}×
                </option>
              ))}
            </select>
          </label>
          <span className="race-tick">
            work tick <strong>{displayedTick}</strong> / {maxWork}
          </span>
        </div>
      </section>

      {finished && (
        <div className="winner-banner" role="status" aria-live="polite">
          <p className="eyebrow">Race complete</p>
          <h2>
            {winner === 'tie'
              ? 'Dead heat.'
              : `${ALGORITHMS[winner === 'a' ? contenderA : contenderB].name} wins.`}
          </h2>
          <p>
            {winner === 'tie'
              ? `Both algorithms completed ${totalWorkA} units of measured work.`
              : `${Math.abs(totalWorkA - totalWorkB)} fewer operations (${Math.round(
                  (Math.abs(totalWorkA - totalWorkB) / Math.max(totalWorkA, totalWorkB)) * 100,
                )}% less measured work) than ${
                  ALGORITHMS[winner === 'a' ? contenderB : contenderA].name
                }.`}{' '}
            Same array, same machine, very different amounts of work.
          </p>
        </div>
      )}

      <div className="race-lanes">
        <RaceLane
          side="a"
          algorithmId={contenderA}
          step={stepA}
          workTotal={totalWorkA}
          tick={displayedTick}
          progress={progressA}
          finished={finished}
          winner={winner}
        />
        <RaceLane
          side="b"
          algorithmId={contenderB}
          step={stepB}
          workTotal={totalWorkB}
          tick={displayedTick}
          progress={progressB}
          finished={finished}
          winner={winner}
        />
      </div>

      <section className="panel race-summary" aria-labelledby="race-summary-title">
        <div>
          <p className="eyebrow">Reading the race</p>
          <h2 id="race-summary-title">Why the finish line moved</h2>
        </div>
        <div className="race-summary-grid">
          <RaceSummary
            algorithmId={contenderA}
            trace={traceA}
            highlight={winner === 'a'}
            label="Contender one"
          />
          <RaceSummary
            algorithmId={contenderB}
            trace={traceB}
            highlight={winner === 'b'}
            label="Contender two"
          />
        </div>
        <p className="fairness-note">
          Each tick advances both traces by one unit of measured work — a comparison or an array
          write. Recursion bookkeeping frames are displayed but do not consume ticks. This compares
          operation counts, not wall-clock milliseconds; a real benchmark also depends on the
          machine, JIT warm-up and the exact implementation.
        </p>
      </section>
    </section>
  );
}

function ContenderPicker({ side, label, value, onChange }) {
  return (
    <label className={`contender-picker side-${side}`}>
      <span className="contender-label">
        <span className="contender-dot" aria-hidden="true" />
        {label}
      </span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {ALGORITHM_ORDER.map((id) => (
          <option key={id} value={id}>
            {ALGORITHMS[id].name} · {ALGORITHMS[id].complexity.average}
          </option>
        ))}
      </select>
    </label>
  );
}

function RaceLane({ side, algorithmId, step, workTotal, tick, progress, finished, winner }) {
  const meta = ALGORITHMS[algorithmId];
  const laneDone = tick >= workTotal;
  const isWinner = finished && winner === side;

  return (
    <section
      className={`race-lane side-${side} ${isWinner ? 'is-winner' : ''} ${laneDone ? 'is-finished' : ''}`}
      aria-labelledby={`lane-${side}-title`}
    >
      <header className="lane-head">
        <div>
          <p className="eyebrow">Contender {side === 'a' ? 'one' : 'two'}</p>
          <h2 id={`lane-${side}-title`}>{meta.name}</h2>
          <p className="lane-tagline">{meta.kicker}</p>
        </div>
        <div className="lane-status">
          {isWinner ? (
            <span className="status-winner">winner</span>
          ) : laneDone ? (
            <span className="status-finished">finished</span>
          ) : (
            <span className="status-racing">racing</span>
          )}
          <span className="lane-complexity">{meta.complexity.average}</span>
        </div>
      </header>

      <div className="lane-progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      <Bars array={step.array} step={step} compact />

      <div className="lane-note">
        <span className={`event-chip event-${step.action}`}>{step.action}</span>
        <p>{step.note}</p>
      </div>

      <div className="lane-metrics">
        <LaneMetric label="comparisons" value={step.comparisons} />
        <LaneMetric label="writes" value={step.writes} />
        <LaneMetric label="swaps" value={step.swaps} />
        <LaneMetric label="max depth" value={step.maxDepth} />
      </div>
    </section>
  );
}

function LaneMetric({ label, value }) {
  return (
    <div className="lane-metric">
      <strong>{value.toLocaleString('en-US')}</strong>
      <span>{label}</span>
    </div>
  );
}

function RaceSummary({ algorithmId, trace, highlight, label }) {
  const meta = ALGORITHMS[algorithmId];
  const final = trace.steps[trace.steps.length - 1];
  return (
    <article className={`race-summary-card ${highlight ? 'is-highlight' : ''}`}>
      <div className="summary-head">
        <span>{label}</span>
        {highlight && <span className="summary-winner">faster</span>}
      </div>
      <h3>{meta.name}</h3>
      <dl>
        <div>
          <dt>comparisons</dt>
          <dd>{final.comparisons}</dd>
        </div>
        <div>
          <dt>writes</dt>
          <dd>{final.writes}</dd>
        </div>
        <div>
          <dt>swaps</dt>
          <dd>{final.swaps}</dd>
        </div>
        <div>
          <dt>measured work</dt>
          <dd>{final.comparisons + final.writes}</dd>
        </div>
      </dl>
    </article>
  );
}
