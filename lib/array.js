import {
  MAX_ARRAY_ITEMS,
  MAX_ARRAY_VALUE,
  MIN_ARRAY_ITEMS,
  MIN_ARRAY_VALUE,
} from './algorithms.js';

export function formatArray(values) {
  return values.join(', ');
}

export function validateValues(values) {
  if (!Array.isArray(values)) return 'The array is missing.';
  if (values.length < MIN_ARRAY_ITEMS) {
    return `Add at least ${MIN_ARRAY_ITEMS} values.`;
  }
  if (values.length > MAX_ARRAY_ITEMS) {
    return `Keep the array to ${MAX_ARRAY_ITEMS} values or fewer.`;
  }
  if (values.some((value) => !Number.isInteger(value))) {
    return 'Every value must be a whole number.';
  }
  if (values.some((value) => value < MIN_ARRAY_VALUE || value > MAX_ARRAY_VALUE)) {
    return `Values must be between ${MIN_ARRAY_VALUE} and ${MAX_ARRAY_VALUE}.`;
  }
  return null;
}

/**
 * Accepts commas, spaces, tabs and semicolons. Returns a friendly error instead
 * of throwing so the input bar can stay optimistic.
 */
export function parseArrayInput(raw) {
  const text = String(raw ?? '').trim();
  if (!text) return { error: 'Type a few numbers first.' };

  const tokens = text.split(/[\s,;]+/).filter(Boolean);
  const values = [];
  for (const token of tokens) {
    if (!/^-?\d+$/.test(token)) {
      return { error: `“${token}” is not a whole number.` };
    }
    values.push(Number(token));
  }

  const error = validateValues(values);
  return error ? { error } : { values };
}

export function randomArray(size = 12, minimum = 3, maximum = 99) {
  const safeSize = Math.min(MAX_ARRAY_ITEMS, Math.max(MIN_ARRAY_ITEMS, size));
  const span = maximum - minimum + 1;
  return Array.from({ length: safeSize }, () => minimum + Math.floor(Math.random() * span));
}

export const ARRAY_PRESETS = [
  {
    id: 'random',
    label: 'Random',
    hint: 'A fresh mix every time',
    make: () => randomArray(),
  },
  {
    id: 'reversed',
    label: 'Reversed',
    hint: 'Worst case for nearly every sort',
    make: () => [78, 71, 64, 57, 50, 43, 36, 29, 22, 15, 8, 2],
  },
  {
    id: 'nearly',
    label: 'Nearly sorted',
    hint: 'Almost ordered, one value astray',
    make: () => [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 22],
  },
  {
    id: 'duplicates',
    label: 'Duplicates',
    hint: 'Equal keys expose stability',
    make: () => [12, 4, 12, 9, 4, 21, 9, 12, 4, 21, 9, 4],
  },
  {
    id: 'negatives',
    label: 'Negatives',
    hint: 'Crosses the zero line',
    make: () => [8, -3, 14, 0, -11, 6, 21, -7, 2, 17, -1, 10],
  },
];

export function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function toInteger(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}
