import { ALGORITHM_ORDER, MAX_TRACE_STEPS } from './algorithms.js';
import { clamp, parseArrayInput, toInteger } from './array.js';
import { LANGUAGES } from './snippets.js';

const TABS = new Set(['lab', 'race', 'debug', 'progress']);
const LANGUAGE_IDS = new Set(LANGUAGES.map((language) => language.id));
const RACE_SPEEDS = new Set([0.5, 1, 2, 4]);

function safeAlgorithm(value, fallback) {
  return ALGORITHM_ORDER.includes(value) ? value : fallback;
}

function safeLanguage(value, fallback = 'js') {
  return LANGUAGE_IDS.has(value) ? value : fallback;
}

function encodeArray(values) {
  return values.map((value) => String(value)).join(',');
}

/**
 * Build a compact hash that captures exactly what the learner is looking at.
 * Numeric values are validated before they reach this function, so the hash is
 * safe to paste into the address bar.
 */
export function buildLabHash({ algorithm, array, step = 0, language = 'js' }) {
  const params = new URLSearchParams();
  params.set('algo', safeAlgorithm(algorithm, 'bubble'));
  params.set('a', encodeArray(array));
  params.set('step', String(clamp(toInteger(step), 0, MAX_TRACE_STEPS - 1)));
  params.set('lang', safeLanguage(language));
  return `#lab?${params.toString()}`;
}

export function buildRaceHash({ c1, c2, array, tick = 0, speed = 1 }) {
  const params = new URLSearchParams();
  params.set('c1', safeAlgorithm(c1, 'bubble'));
  params.set('c2', safeAlgorithm(c2, 'quick'));
  params.set('a', encodeArray(array));
  params.set('tick', String(clamp(toInteger(tick), 0, MAX_TRACE_STEPS - 1)));
  params.set('speed', RACE_SPEEDS.has(Number(speed)) ? String(speed) : '1');
  return `#race?${params.toString()}`;
}

/**
 * Parse a location hash without assuming window exists. Unknown or invalid
 * pieces fall back to safe defaults; malicious strings never become markup.
 */
export function parseShareHash(hash = '') {
  const clean = String(hash).replace(/^#\/?/, '');
  const [rawTab, rawQuery = ''] = clean.split('?');
  const tab = TABS.has(rawTab) ? rawTab : 'lab';
  const params = new URLSearchParams(rawQuery);
  const parsedArray = parseArrayInput(params.get('a') ?? '').values;

  const lab = {
    algorithm: safeAlgorithm(params.get('algo'), 'bubble'),
    array: parsedArray ?? null,
    step: clamp(toInteger(params.get('step'), 0), 0, MAX_TRACE_STEPS - 1),
    language: safeLanguage(params.get('lang')),
  };

  const race = {
    c1: safeAlgorithm(params.get('c1'), 'bubble'),
    c2: safeAlgorithm(params.get('c2'), 'quick'),
    array: parsedArray ?? null,
    tick: clamp(toInteger(params.get('tick'), 0), 0, MAX_TRACE_STEPS - 1),
    speed: RACE_SPEEDS.has(Number(params.get('speed'))) ? Number(params.get('speed')) : 1,
  };

  return {
    tab,
    hasState: Boolean(rawTab),
    lab,
    race,
  };
}

export function currentShareUrl(hash) {
  if (typeof window === 'undefined') return hash;
  return `${window.location.origin}${window.location.pathname}${window.location.search}${hash}`;
}

export function replaceHash(hash) {
  if (typeof window === 'undefined') return;
  if (window.location.hash === hash) return;
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${hash}`);
}
