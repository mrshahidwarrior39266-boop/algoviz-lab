import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALGORITHMS,
  ALGORITHM_ORDER,
  MAX_ARRAY_ITEMS,
  buildTrace,
  isSorted,
  operationEfficiency,
} from '../lib/algorithms.js';
import { parseArrayInput, validateValues } from '../lib/array.js';
import { buildLabHash, buildRaceHash, parseShareHash } from '../lib/share.js';
import { LANGUAGES, SNIPPETS } from '../lib/snippets.js';
import { DEBUG_CHALLENGES } from '../lib/debugChallenges.js';
import { getBadges, getLevel } from '../lib/progress.js';

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function makeArrays() {
  const random = seededRandom(42);
  const arrays = [
    [3, 1, 2],
    [5, 5, 5, 5],
    [1, 2, 3, 4, 5, 6],
    [6, 5, 4, 3, 2, 1],
    [2, -3, 0, 8, -1, 7, 2],
    [12, 4, 12, 9, 4, 21, 9, 12],
  ];
  for (let length = 3; length <= 18; length += 1) {
    for (let run = 0; run < 8; run += 1) {
      arrays.push(
        Array.from({ length }, () => Math.floor(random() * 60) - 20),
      );
    }
  }
  return arrays;
}

test('every algorithm produces a sorted, monotonic, replayable trace', () => {
  const arrays = makeArrays();
  for (const algorithmId of ALGORITHM_ORDER) {
    for (const input of arrays) {
      const trace = buildTrace(algorithmId, input);
      assert.equal(trace.algorithm, algorithmId);
      assert.equal(trace.sorted, true, `${algorithmId} did not sort ${input}`);
      assert.equal(isSorted(trace.final), true);
      assert.deepEqual(trace.final, [...input].sort((a, b) => a - b));
      assert.ok(trace.steps.length > 1);
      assert.equal(trace.steps[0].action, 'init');
      assert.equal(trace.steps.at(-1).action, 'done');
      assert.deepEqual(trace.steps[0].array, input);
      assert.deepEqual(trace.steps.at(-1).array, trace.final);

      let lastComparisons = 0;
      let lastWrites = 0;
      let lastSwaps = 0;
      for (const step of trace.steps) {
        assert.equal(step.array.length, input.length);
        assert.ok(step.comparisons >= lastComparisons);
        assert.ok(step.writes >= lastWrites);
        assert.ok(step.swaps >= lastSwaps);
        assert.ok(step.swaps * 2 <= step.writes);
        assert.ok(step.maxDepth >= step.depth);
        lastComparisons = step.comparisons;
        lastWrites = step.writes;
        lastSwaps = step.swaps;
      }

      assert.equal(lastComparisons, trace.comparisons);
      assert.equal(lastWrites, trace.writes);
      assert.equal(lastSwaps, trace.swaps);
    }
  }
});

test('best and worst cases line up with the Big-O claims', () => {
  const sorted = [1, 2, 3, 4, 5, 6, 7, 8];
  const reversed = [...sorted].reverse();
  const bubble = buildTrace('bubble', sorted);
  const insertion = buildTrace('insertion', sorted);
  const selection = buildTrace('selection', reversed);
  const quick = buildTrace('quick', reversed);

  assert.equal(bubble.comparisons, sorted.length - 1);
  assert.equal(bubble.swaps, 0);
  assert.equal(insertion.comparisons, sorted.length - 1);
  assert.equal(insertion.swaps, 0);
  assert.equal(selection.comparisons, (sorted.length * (sorted.length - 1)) / 2);
  assert.ok(quick.maxDepth >= 2);
});

test('quick sort reports recursion depth and stays within the step budget', () => {
  const input = Array.from({ length: MAX_ARRAY_ITEMS }, (_, index) => MAX_ARRAY_ITEMS - index);
  const trace = buildTrace('quick', input);
  assert.equal(trace.sorted, true);
  assert.ok(trace.maxDepth > 1);
  assert.ok(trace.steps.length < 6000);
  for (const step of trace.steps) {
    if (step.action === 'enter') assert.ok(step.depth >= 1);
    if (step.action === 'exit') assert.ok(step.depth >= 0);
  }
});

test('array input validation rejects malformed and out-of-range values', () => {
  assert.deepEqual(parseArrayInput('5, 2, 9, 1'), { values: [5, 2, 9, 1] });
  assert.deepEqual(parseArrayInput('5 2 9 1'), { values: [5, 2, 9, 1] });
  assert.ok(parseArrayInput('5, 2, nine').error);
  assert.ok(parseArrayInput('1, 2').error);
  assert.ok(parseArrayInput('1, 2, 1000').error);
  assert.ok(validateValues(Array.from({ length: MAX_ARRAY_ITEMS + 1 }, () => 1)));
  assert.equal(validateValues([1, 2, 3]), null);
});

test('share hashes round-trip and sanitize untrusted values', () => {
  const hash = buildLabHash({
    algorithm: 'quick',
    array: [9, 1, 2, 8, 3],
    step: 12,
    language: 'python',
  });
  const parsed = parseShareHash(hash);
  assert.equal(parsed.tab, 'lab');
  assert.equal(parsed.lab.algorithm, 'quick');
  assert.deepEqual(parsed.lab.array, [9, 1, 2, 8, 3]);
  assert.equal(parsed.lab.step, 12);
  assert.equal(parsed.lab.language, 'python');

  const raceHash = buildRaceHash({
    c1: 'insertion',
    c2: 'quick',
    array: [4, 2, 8, 1],
    tick: 7,
    speed: 2,
  });
  const race = parseShareHash(raceHash);
  assert.equal(race.tab, 'race');
  assert.equal(race.race.c1, 'insertion');
  assert.equal(race.race.c2, 'quick');
  assert.equal(race.race.speed, 2);

  const hostile = parseShareHash(
    '#lab?algo=%3Cscript%3E&a=1%3Balert(1)&step=-999&lang=ruby',
  );
  assert.equal(hostile.lab.algorithm, 'bubble');
  assert.equal(hostile.lab.array, null);
  assert.equal(hostile.lab.step, 0);
  assert.equal(hostile.lab.language, 'js');
});

test('every language exposes anchors for every observed trace tag', () => {
  const observed = new Set();
  for (const algorithmId of ALGORITHM_ORDER) {
    const trace = buildTrace(algorithmId, [7, 2, 9, 1, 5, 3]);
    for (const step of trace.steps) observed.add(step.tag);
    for (const language of LANGUAGES) {
      const snippet = SNIPPETS[algorithmId][language.id];
      assert.ok(snippet, `${algorithmId}/${language.id} missing`);
      assert.ok(snippet.code.includes('a'), `${algorithmId}/${language.id} empty`);
      for (const tag of new Set(trace.steps.map((step) => step.tag))) {
        assert.ok(
          Number.isInteger(snippet.anchors[tag]) && snippet.anchors[tag] >= 1,
          `${algorithmId}/${language.id} has no anchor for ${tag}`,
        );
        assert.ok(snippet.anchors[tag] <= snippet.lines.length);
      }
    }
  }
  for (const algorithmId of ALGORITHM_ORDER) {
    assert.ok(ALGORITHMS[algorithmId]);
    assert.ok(Object.keys(SNIPPETS[algorithmId]).length === 4);
  }
  assert.ok(observed.size >= 5);
});

test('telemetry helpers stay in range', () => {
  const trace = buildTrace('bubble', [4, 2, 9, 1]);
  for (let index = 0; index < trace.steps.length; index += 1) {
    const value = operationEfficiency(trace.steps[index], 4);
    assert.ok(value >= 0 && value <= 100);
  }
});

test('debug challenges point at an existing line', () => {
  assert.equal(DEBUG_CHALLENGES.length, 3);
  for (const challenge of DEBUG_CHALLENGES) {
    assert.ok(challenge.bugLine >= 1);
    assert.ok(challenge.bugLine <= challenge.code.length);
    assert.ok(challenge.explanation.length > 20);
    assert.ok(challenge.xp > 0);
  }
});

test('levels and badges derive from persisted stats', () => {
  assert.equal(getLevel(0).name, 'Novice Tracer');
  assert.equal(getLevel(120).name, 'Algorithm Apprentice');
  assert.equal(getLevel(460).name, 'Master Optimizer');
  assert.equal(getLevel(460).progress, 100);

  const badges = getBadges({
    xp: 460,
    completedLessons: { quick: true },
    bestPredictionStreak: 3,
    debugSolved: { a: true, b: true, c: true },
    customArraysRun: 2,
    languageViews: { js: true, python: true, cpp: true, java: true },
    racesCompleted: 1,
    predictionsCorrect: 10,
  });
  assert.equal(badges.filter((badge) => badge.unlocked).length, badges.length);
});
