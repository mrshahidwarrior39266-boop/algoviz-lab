/**
 * Pure sorting-trace engine.
 *
 * Every algorithm records a complete, replayable trace. A step is a snapshot
 * of the array plus the operation counters at that moment. Keeping this module
 * free of React and browser APIs lets the tests exercise the exact traces the
 * UI renders.
 */

export const MIN_ARRAY_ITEMS = 3;
export const MAX_ARRAY_ITEMS = 24;
export const MAX_ARRAY_VALUE = 999;
export const MIN_ARRAY_VALUE = -99;
export const MAX_TRACE_STEPS = 6000;

export const DEFAULT_ARRAY = [18, 7, 42, 3, 25, 11, 36, 1, 29, 14, 9, 21];

export const ALGORITHM_ORDER = ['bubble', 'selection', 'insertion', 'quick'];

export const ALGORITHMS = {
  bubble: {
    id: 'bubble',
    name: 'Bubble Sort',
    kicker: 'Neighbour by neighbour',
    complexity: {
      best: 'Ω(n)',
      average: 'Θ(n²)',
      worst: 'O(n²)',
      space: 'O(1)',
    },
    stable: true,
    tagline: 'The gentlest possible sort: keep swapping neighbours until nothing is out of order.',
    description:
      'Bubble Sort walks the array again and again, trading adjacent items whenever the left one is larger. After each pass the largest remaining value has bubbled to the end. An early-exit flag turns an already sorted array into a single linear scan.',
    watch: [
      'The largest unsorted value settles at the end of every pass.',
      'A pass with no swaps means the whole array is already ordered.',
      'Comparisons dominate; swaps only happen when a pair is inverted.',
    ],
    interview: 'Rarely used in production, but the canonical introduction to invariants and best/worst cases.',
  },
  selection: {
    id: 'selection',
    name: 'Selection Sort',
    kicker: 'Choose the smallest',
    complexity: {
      best: 'Ω(n²)',
      average: 'Θ(n²)',
      worst: 'O(n²)',
      space: 'O(1)',
    },
    stable: false,
    tagline: 'Scan the unsorted region for the minimum, then put it exactly where it belongs.',
    description:
      'Selection Sort splits the array into a sorted prefix and an unsorted suffix. Each pass scans the suffix for its smallest value and swaps it into the next prefix slot. Comparisons are predictable, but a single pass can move a value a very long way.',
    watch: [
      'The sorted prefix grows from the left, one final position per pass.',
      'The algorithm always performs the same number of comparisons.',
      'Long-distance swaps are what make it unstable.',
    ],
    interview: 'A useful example of an algorithm with excellent write economy and poor comparison economy.',
  },
  insertion: {
    id: 'insertion',
    name: 'Insertion Sort',
    kicker: 'Build a sorted hand',
    complexity: {
      best: 'Ω(n)',
      average: 'Θ(n²)',
      worst: 'O(n²)',
      space: 'O(1)',
    },
    stable: true,
    tagline: 'Grow a sorted prefix by walking each new item left until it is at home.',
    description:
      'Insertion Sort treats the left side of the array like a hand of cards that is always sorted. It takes the next card and swaps it leftwards past every larger neighbour. Nearly sorted data is almost free; reverse sorted data is the worst case.',
    watch: [
      'Only strictly larger neighbours are passed, which keeps equal values stable.',
      'A sorted input needs one comparison per element and zero swaps.',
      'The number of writes grows quickly on reversed data.',
    ],
    interview: 'The practical choice for tiny or nearly sorted arrays, and the inner loop inside several hybrid sorts.',
  },
  quick: {
    id: 'quick',
    name: 'Quick Sort',
    kicker: 'Partition and conquer',
    complexity: {
      best: 'Ω(n log n)',
      average: 'Θ(n log n)',
      worst: 'O(n²)',
      space: 'O(log n)',
    },
    stable: false,
    tagline: 'Pick a pivot, partition around it, then recurse into both sides.',
    description:
      'Quick Sort chooses a pivot and rearranges the range so smaller values sit left and larger values sit right. The pivot is then in its final position forever. Recursing on both sides gives the average n log n behaviour that made this the standard general-purpose sort.',
    watch: [
      'The recursion depth gauge reveals how balanced the partitions are.',
      'A bad pivot on sorted input creates the quadratic worst case.',
      'Lomuto partitioning places the pivot after the final swap.',
    ],
    interview: 'The classic divide-and-conquer interview algorithm; be ready to explain pivot choice and worst-case depth.',
  },
};

const isIndex = (value) => Number.isInteger(value) && value >= 0;

function assertAlgorithm(algorithmId) {
  if (!ALGORITHMS[algorithmId]) {
    throw new Error(`Unknown algorithm: ${algorithmId}`);
  }
}

export function isSorted(values) {
  for (let index = 1; index < values.length; index += 1) {
    if (values[index - 1] > values[index]) return false;
  }
  return true;
}

/**
 * Records operation snapshots while an algorithm mutates the working array.
 * All snapshots are immutable copies so scrubbing can jump anywhere instantly.
 */
class Tracer {
  constructor(values) {
    this.values = [...values];
    this.steps = [];
    this.comparisons = 0;
    this.writes = 0;
    this.swaps = 0;
    this.depth = 0;
    this.maxDepth = 0;
    this.emit('init', [], 'init', 'Ready. Press play or drag the scrubber.');
  }

  emit(action, indices = [], tag = 'init', note = '') {
    if (this.steps.length >= MAX_TRACE_STEPS) {
      throw new Error('This input produces too many steps to visualize.');
    }
    this.steps.push({
      array: this.values.slice(),
      action,
      indices: indices.filter(isIndex),
      tag,
      note,
      comparisons: this.comparisons,
      writes: this.writes,
      swaps: this.swaps,
      depth: this.depth,
      maxDepth: this.maxDepth,
    });
  }

  compare(left, right, tag = 'compare') {
    this.comparisons += 1;
    this.emit(
      'compare',
      [left, right],
      tag,
      `Compare a[${left}] = ${this.values[left]} with a[${right}] = ${this.values[right]}.`,
    );
    return this.values[left] - this.values[right];
  }

  swap(left, right, tag = 'swap') {
    if (left === right) return;
    const beforeLeft = this.values[left];
    const beforeRight = this.values[right];
    [this.values[left], this.values[right]] = [beforeRight, beforeLeft];
    this.writes += 2;
    this.swaps += 1;
    this.emit(
      'swap',
      [left, right],
      tag,
      `Swap a[${left}] = ${beforeLeft} with a[${right}] = ${beforeRight}.`,
    );
  }

  pass(indices, note) {
    this.emit('pass', indices, 'outer', note);
  }

  minimum(index, note) {
    this.emit('min', [index], 'min', note);
  }

  pivot(index, note) {
    this.emit('pivot', [index], 'pivot', note);
  }

  base(index, note) {
    this.emit('base', [index], 'base', note);
  }

  enter(note) {
    this.depth += 1;
    this.maxDepth = Math.max(this.maxDepth, this.depth);
    this.emit('enter', [], 'enter', note);
  }

  exit(note) {
    this.depth = Math.max(0, this.depth - 1);
    this.emit('exit', [], 'exit', note);
  }

  finish() {
    const sorted = isSorted(this.values);
    this.emit(
      'done',
      [],
      'done',
      sorted
        ? `Sorted. ${this.comparisons} comparisons, ${this.writes} writes, ${this.swaps} swaps.`
        : 'Finished, but the array is not in ascending order.',
    );
    return {
      steps: this.steps,
      final: this.values.slice(),
      comparisons: this.comparisons,
      writes: this.writes,
      swaps: this.swaps,
      maxDepth: this.maxDepth,
      sorted,
    };
  }
}

function bubbleSort(values) {
  const tracer = new Tracer(values);
  const array = tracer.values;
  const length = array.length;

  for (let pass = 0; pass < length - 1; pass += 1) {
    let swapped = false;
    tracer.pass(
      [length - pass - 1],
      `Pass ${pass + 1}: compare the unsorted region from left to right.`,
    );

    for (let index = 0; index < length - pass - 1; index += 1) {
      tracer.compare(index, index + 1, 'compare');
      if (array[index] > array[index + 1]) {
        tracer.swap(index, index + 1, 'swap');
        swapped = true;
      }
    }

    if (!swapped) {
      tracer.emit('pass', [], 'done', 'A clean pass: the array is already sorted.');
      break;
    }
  }

  return tracer.finish();
}

function selectionSort(values) {
  const tracer = new Tracer(values);
  const array = tracer.values;
  const length = array.length;

  for (let boundary = 0; boundary < length - 1; boundary += 1) {
    let minimum = boundary;
    tracer.pass(
      [boundary],
      `Pass ${boundary + 1}: find the smallest value for position ${boundary}.`,
    );

    for (let index = boundary + 1; index < length; index += 1) {
      tracer.compare(index, minimum, 'compare');
      if (array[index] < array[minimum]) {
        minimum = index;
        tracer.minimum(index, `New minimum: a[${index}] = ${array[index]}.`);
      }
    }

    if (minimum !== boundary) {
      tracer.swap(boundary, minimum, 'swap');
    }
  }

  return tracer.finish();
}

function insertionSort(values) {
  const tracer = new Tracer(values);
  const array = tracer.values;
  const length = array.length;

  for (let index = 1; index < length; index += 1) {
    tracer.pass([index], `Insert a[${index}] = ${array[index]} into the sorted prefix.`);
    let cursor = index;

    while (cursor > 0) {
      tracer.compare(cursor - 1, cursor, 'compare');
      if (array[cursor - 1] <= array[cursor]) break;
      tracer.swap(cursor - 1, cursor, 'swap');
      cursor -= 1;
    }
  }

  return tracer.finish();
}

function quickSort(values) {
  const tracer = new Tracer(values);
  const array = tracer.values;

  function quick(left, right) {
    tracer.enter(`Sort range [${left}, ${right}].`);

    if (left >= right) {
      if (left === right) {
        tracer.base(left, `a[${left}] = ${array[left]} is already in its final position.`);
      }
      tracer.exit('Empty or single-item range; return to the caller.');
      return;
    }

    const pivot = array[right];
    tracer.pivot(right, `Choose a[${right}] = ${pivot} as the pivot.`);
    let boundary = left;

    for (let index = left; index < right; index += 1) {
      tracer.compare(index, right, 'compare');
      if (array[index] < pivot) {
        tracer.swap(boundary, index, 'swap');
        boundary += 1;
      }
    }

    if (boundary !== right) tracer.swap(boundary, right, 'swap');
    tracer.pivot(boundary, `Pivot ${pivot} is now fixed at index ${boundary}.`);

    quick(left, boundary - 1);
    quick(boundary + 1, right);
    tracer.exit(`Range [${left}, ${right}] complete.`);
  }

  if (array.length > 0) quick(0, array.length - 1);
  return tracer.finish();
}

const RUNNERS = {
  bubble: bubbleSort,
  selection: selectionSort,
  insertion: insertionSort,
  quick: quickSort,
};

/**
 * Build a complete trace for one algorithm and array.
 */
export function buildTrace(algorithmId, values) {
  assertAlgorithm(algorithmId);
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error('An array with at least one value is required.');
  }
  const result = RUNNERS[algorithmId](values);
  return {
    ...result,
    algorithm: algorithmId,
    initial: [...values],
    steps: result.steps,
  };
}

/**
 * Worst-case work model used by the live efficiency meter. It is deliberately
 * a simple comparison + write budget, not a benchmark.
 */
export function worstCaseOperations(size) {
  return Math.max(1, size * size);
}

export function operationEfficiency(step, size) {
  if (!step) return 100;
  const work = step.comparisons + step.writes;
  const budget = worstCaseOperations(size);
  return Math.max(0, Math.min(100, Math.round((1 - work / budget) * 100)));
}

export function operationBreakdown(trace, stepIndex) {
  const step = trace.steps[Math.min(Math.max(stepIndex, 0), trace.steps.length - 1)];
  return {
    comparisons: step?.comparisons ?? 0,
    writes: step?.writes ?? 0,
    swaps: step?.swaps ?? 0,
    depth: step?.depth ?? 0,
    maxDepth: step?.maxDepth ?? 0,
  };
}

/**
 * Human-friendly summary of the active event.
 */
export function stepLabel(step) {
  if (!step) return 'No step selected.';
  return {
    init: 'Initial array',
    compare: 'Comparison',
    swap: 'Swap',
    pass: 'Next pass',
    min: 'New minimum',
    pivot: 'Pivot placed',
    base: 'Base case',
    enter: 'Recursive call',
    exit: 'Return',
    done: 'Sorted',
  }[step.action] ?? 'Step';
}
