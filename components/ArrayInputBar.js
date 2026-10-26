'use client';

import { useEffect, useState } from 'react';
import { ARRAY_PRESETS, formatArray, parseArrayInput } from '@/lib/array';

export default function ArrayInputBar({ values, onApply, compact = false }) {
  const [text, setText] = useState(formatArray(values));
  const [error, setError] = useState('');

  useEffect(() => {
    setText(formatArray(values));
    setError('');
  }, [values]);

  function submit(event) {
    event.preventDefault();
    const parsed = parseArrayInput(text);
    if (parsed.error) {
      setError(parsed.error);
      return;
    }
    setError('');
    onApply(parsed.values);
  }

  function usePreset(make) {
    const next = make();
    setError('');
    setText(formatArray(next));
    onApply(next);
  }

  return (
    <div className={`array-input ${compact ? 'is-compact' : ''}`}>
      <form className="array-form" onSubmit={submit}>
        <label className="field-label" htmlFor={compact ? 'race-array' : 'lab-array'}>
          Array
        </label>
        <input
          id={compact ? 'race-array' : 'lab-array'}
          className="array-field"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            if (error) setError('');
          }}
          spellCheck="false"
          inputMode="text"
          aria-describedby={compact ? 'race-array-hint' : 'lab-array-hint'}
          aria-invalid={Boolean(error)}
        />
        <button type="submit" className="btn btn-small btn-quiet">
          Apply
        </button>
        <span id={compact ? 'race-array-hint' : 'lab-array-hint'} className="field-hint">
          3–24 integers · −99 to 999
        </span>
      </form>

      <div className="preset-row" aria-label="Array presets">
        {ARRAY_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className="preset-chip"
            title={preset.hint}
            onClick={() => usePreset(preset.make)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
