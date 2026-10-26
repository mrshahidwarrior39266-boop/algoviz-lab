import { ALGORITHMS, operationEfficiency, stepLabel } from '@/lib/algorithms';

export default function TelemetryHUD({ trace, stepIndex, algorithmId }) {
  const meta = ALGORITHMS[algorithmId];
  const step = trace.steps[stepIndex] ?? trace.steps[0];
  const size = step.array.length;
  const efficiency = operationEfficiency(step, size);
  const depthLabel = algorithmId === 'quick' ? `${step.depth}` : '0';

  return (
    <section className="telemetry" aria-label="Live algorithm telemetry">
      <div className="telemetry-grid">
        <Metric code="C" label="comparisons" value={step.comparisons} accent="compare" />
        <Metric code="W" label="array writes" value={step.writes} accent="write" />
        <Metric code="S" label="swaps" value={step.swaps} accent="swap" />
        <div className="metric metric-depth">
          <span className="metric-code">D</span>
          <div className="metric-copy">
            <strong key={depthLabel} className="metric-value">
              {depthLabel}
            </strong>
            <span className="metric-label">
              stack depth
              <small>
                {algorithmId === 'quick' ? `peak ${step.maxDepth}` : 'iterative'}
              </small>
            </span>
          </div>
          <div
            className="depth-gauge"
            style={{
              '--depth-fill': `${
                algorithmId === 'quick'
                  ? Math.min(100, Math.round((step.depth / Math.max(1, step.maxDepth)) * 100))
                  : 0
              }%`,
            }}
            title={algorithmId === 'quick' ? 'Current recursion depth relative to the peak' : 'This algorithm uses loops, not recursion.'}
            aria-hidden="true"
          />
        </div>
      </div>

      <div className="complexity-strip">
        <div className="complexity-badges" aria-label="Complexity class">
          <span>
            <small>best</small>
            {meta.complexity.best}
          </span>
          <span>
            <small>average</small>
            {meta.complexity.average}
          </span>
          <span>
            <small>worst</small>
            {meta.complexity.worst}
          </span>
          <span className={`stability ${meta.stable ? 'is-stable' : ''}`}>
            <small>space {meta.complexity.space}</small>
            {meta.stable ? 'stable' : 'unstable'}
          </span>
        </div>

        <div
          className="efficiency"
          title="Headroom against an n² worst-case budget of comparisons plus writes. This is a teaching signal, not a benchmark."
        >
          <div className="efficiency-label">
            <span>live efficiency</span>
            <strong>{efficiency}%</strong>
          </div>
          <div className="efficiency-track" role="img" aria-label={`Efficiency ${efficiency} percent`}>
            <span style={{ width: `${efficiency}%` }} />
          </div>
        </div>
      </div>

      <p className="telemetry-note">
        <span className="live-dot" aria-hidden="true" />
        {stepLabel(step)} · counters reflect this exact frame
      </p>
    </section>
  );
}

function Metric({ code, label, value, accent }) {
  return (
    <div className={`metric metric-${accent}`}>
      <span className="metric-code">{code}</span>
      <div className="metric-copy">
        <strong key={value} className="metric-value">
          {value.toLocaleString('en-US')}
        </strong>
        <span className="metric-label">{label}</span>
      </div>
    </div>
  );
}
