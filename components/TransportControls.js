'use client';

const SPEEDS = [0.5, 1, 2, 4];

export default function TransportControls({
  playing,
  onToggle,
  onStep,
  onReset,
  speed,
  onSpeed,
  stepIndex,
  total,
}) {
  const atStart = stepIndex <= 0;
  const atEnd = stepIndex >= total - 1;

  return (
    <div className="transport">
      <div className="transport-buttons">
        <button
          type="button"
          className="icon-button"
          onClick={onReset}
          disabled={atStart}
          aria-label="Reset to the first step"
          title="Reset"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 5v5h5M5.8 17.3A8 8 0 1 0 4.5 8.5" />
          </svg>
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={() => onStep(stepIndex - 1)}
          disabled={atStart}
          aria-label="Previous step"
          title="Previous step"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 5 8 12l7 7" />
          </svg>
        </button>
        <button
          type="button"
          className="play-button"
          onClick={onToggle}
          aria-label={playing ? 'Pause' : atEnd ? 'Replay from the start' : 'Play'}
          title={playing ? 'Pause (Space)' : 'Play (Space)'}
        >
          {playing ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5v14M16 5v14" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true" className="play-icon">
              <path d="M8 5.5v13l10-6.5-10-6.5Z" />
            </svg>
          )}
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={() => onStep(stepIndex + 1)}
          disabled={atEnd}
          aria-label="Next step"
          title="Next step"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m9 5 7 7-7 7" />
          </svg>
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={() => onStep(total - 1)}
          disabled={atEnd}
          aria-label="Jump to the final step"
          title="Jump to the result"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m5 5 7 7-7 7M13 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="transport-meta">
        <span className="step-counter">
          step <strong>{stepIndex + 1}</strong> / {total}
        </span>
        <label className="speed-control">
          <span>speed</span>
          <select value={speed} onChange={(event) => onSpeed(Number(event.target.value))}>
            {SPEEDS.map((value) => (
              <option key={value} value={value}>
                {value}×
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
