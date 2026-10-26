import Bars from './Bars';
import { stepLabel } from '@/lib/algorithms';

export default function ArrayVisualizer({ trace, stepIndex }) {
  const step = trace.steps[stepIndex] ?? trace.steps[0];
  const sorted = step.action === 'done';

  return (
    <section className={`visualizer ${sorted ? 'is-complete' : ''}`} aria-labelledby="visualizer-title">
      <header className="visualizer-head">
        <div>
          <p className="eyebrow" id="visualizer-title">
            Live array
          </p>
          <p className="visualizer-meta">
            Step {stepIndex + 1} of {trace.steps.length} · {step.array.length} values
          </p>
        </div>
        <div className="visualizer-badges">
          <span className={`event-chip event-${step.action}`}>{stepLabel(step)}</span>
          {sorted && <span className="sorted-chip">Ascending ✓</span>}
        </div>
      </header>

      <Bars array={step.array} step={step} />

      <footer className="visualizer-foot">
        <p>{step.note || 'The array is ready.'}</p>
        {step.indices.length > 0 && (
          <span className="index-readout">
            {step.indices.map((index) => `a[${index}]`).join(' · ')}
          </span>
        )}
      </footer>
    </section>
  );
}
