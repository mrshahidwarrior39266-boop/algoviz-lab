'use client';

import { stepLabel } from '@/lib/algorithms';

export default function StepTimeline({ trace, stepIndex, onStep, onScrubStart }) {
  const total = trace.steps.length;
  const maximum = Math.max(0, total - 1);
  const progress = maximum ? (stepIndex / maximum) * 100 : 0;
  const step = trace.steps[stepIndex] ?? trace.steps[0];
  const ticks = trace.steps
    .map((item, index) => ({ action: item.action, index }))
    .filter((item) => ['swap', 'pivot', 'min', 'done'].includes(item.action))
    .slice(0, 160);

  return (
    <section className="timeline" aria-labelledby="timeline-label">
      <div className="timeline-head">
        <label id="timeline-label" htmlFor="trace-scrubber">
          Trace position
        </label>
        <span className="timeline-count">
          <strong>{stepIndex + 1}</strong> / {total}
        </span>
      </div>

      <div className="scrub-wrap">
        <div className="scrub-ticks" aria-hidden="true">
          {ticks.map((tick) => (
            <span
              key={`${tick.index}-${tick.action}`}
              className={`scrub-tick tick-${tick.action}`}
              style={{ left: `${maximum ? (tick.index / maximum) * 100 : 0}%` }}
            />
          ))}
        </div>
        <input
          id="trace-scrubber"
          type="range"
          className="scrubber"
          min="0"
          max={maximum}
          step="1"
          value={stepIndex}
          onChange={(event) => {
            onScrubStart?.();
            onStep(Number(event.target.value));
          }}
          style={{ '--scrub-progress': `${progress}%` }}
          aria-valuetext={`Step ${stepIndex + 1} of ${total}: ${stepLabel(step)}. ${step.note}`}
        />
      </div>

      <div className="timeline-foot">
        <span className={`timeline-event event-${step.action}`}>{stepLabel(step)}</span>
        <p>{step.note}</p>
      </div>
    </section>
  );
}
