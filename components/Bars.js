export default function Bars({ array, step, compact = false }) {
  const maximum = Math.max(...array.map((value) => Math.abs(value)), 1);
  const active = new Set(step?.indices ?? []);
  const action = step?.action ?? 'init';
  const done = action === 'done';
  const label = `Array of ${array.length} values: ${array.join(', ')}`;

  return (
    <div
      className={`bars ${compact ? 'bars-compact' : ''} ${done ? 'is-done' : ''}`}
      role="img"
      aria-label={label}
    >
      {array.map((value, index) => {
        const height = 10 + (Math.abs(value) / maximum) * 84;
        const classes = ['bar-column'];
        if (active.has(index)) classes.push(`bar-${action}`);
        if (done) classes.push('bar-settled');

        return (
          <div className={classes.join(' ')} key={`${index}-${array.length}`} title={`index ${index}: ${value}`}>
            <span className="bar-value">{value}</span>
            <div className="bar-track">
              <div
                className={`bar-fill ${value < 0 ? 'is-negative' : ''}`}
                style={{ height: `${height}%` }}
              />
            </div>
            <span className="bar-index" aria-hidden="true">
              {index}
            </span>
          </div>
        );
      })}
    </div>
  );
}
