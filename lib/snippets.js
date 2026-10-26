/**
 * Multi-language lesson snippets. Each language keeps its own idiomatic code;
 * anchors map a trace event to the exact line that caused it, so switching
 * languages moves the highlight to the equivalent line instead of a fixed row.
 */

export const LANGUAGES = [
  { id: 'js', label: 'JavaScript', short: 'JS', monaco: 'javascript', editable: true },
  { id: 'python', label: 'Python', short: 'PY', monaco: 'python', editable: false },
  { id: 'cpp', label: 'C++', short: 'C++', monaco: 'cpp', editable: false },
  { id: 'java', label: 'Java', short: 'Java', monaco: 'java', editable: false },
];

const JS_BUBBLE = [
  'function sort(a) {',
  '  const n = a.length;',
  '  for (let i = 0; i < n - 1; i++) {',
  '    let swapped = false;',
  '    for (let j = 0; j < n - i - 1; j++) {',
  '      // Compare neighbours',
  '      if (a[j] > a[j + 1]) {',
  '        [a[j], a[j + 1]] = [a[j + 1], a[j]];',
  '        swapped = true;',
  '      }',
  '    }',
  '    if (!swapped) break;',
  '  }',
  '  return a;',
  '}',
];

const PY_BUBBLE = [
  'def sort(a):',
  '    n = len(a)',
  '    for i in range(n - 1):',
  '        swapped = False',
  '        for j in range(n - i - 1):',
  '            # Compare neighbours',
  '            if a[j] > a[j + 1]:',
  '                a[j], a[j + 1] = a[j + 1], a[j]',
  '                swapped = True',
  '        if not swapped:',
  '            break',
  '    return a',
];

const CPP_BUBBLE = [
  'void bubbleSort(vector<int>& a) {',
  '    int n = (int)a.size();',
  '    for (int i = 0; i < n - 1; ++i) {',
  '        bool swapped = false;',
  '        for (int j = 0; j < n - i - 1; ++j) {',
  '            // Compare neighbours',
  '            if (a[j] > a[j + 1]) {',
  '                swap(a[j], a[j + 1]);',
  '                swapped = true;',
  '            }',
  '        }',
  '        if (!swapped) break;',
  '    }',
  '}',
];

const JAVA_BUBBLE = [
  'void bubbleSort(int[] a) {',
  '    int n = a.length;',
  '    for (int i = 0; i < n - 1; i++) {',
  '        boolean swapped = false;',
  '        for (int j = 0; j < n - i - 1; j++) {',
  '            // Compare neighbours',
  '            if (a[j] > a[j + 1]) {',
  '                int temp = a[j];',
  '                a[j] = a[j + 1];',
  '                a[j + 1] = temp;',
  '                swapped = true;',
  '            }',
  '        }',
  '        if (!swapped) break;',
  '    }',
  '}',
];

const JS_SELECTION = [
  'function sort(a) {',
  '  const n = a.length;',
  '  for (let i = 0; i < n - 1; i++) {',
  '    let min = i;',
  '    for (let j = i + 1; j < n; j++) {',
  '      // Find the smallest value',
  '      if (a[j] < a[min]) {',
  '        min = j;',
  '      }',
  '    }',
  '    if (min !== i) {',
  '      [a[i], a[min]] = [a[min], a[i]];',
  '    }',
  '  }',
  '  return a;',
  '}',
];

const PY_SELECTION = [
  'def sort(a):',
  '    n = len(a)',
  '    for i in range(n - 1):',
  '        smallest = i',
  '        for j in range(i + 1, n):',
  '            # Find the smallest value',
  '            if a[j] < a[smallest]:',
  '                smallest = j',
  '        if smallest != i:',
  '            a[i], a[smallest] = a[smallest], a[i]',
  '    return a',
];

const CPP_SELECTION = [
  'void selectionSort(vector<int>& a) {',
  '    int n = (int)a.size();',
  '    for (int i = 0; i < n - 1; ++i) {',
  '        int minIndex = i;',
  '        for (int j = i + 1; j < n; ++j) {',
  '            // Find the smallest value',
  '            if (a[j] < a[minIndex]) {',
  '                minIndex = j;',
  '            }',
  '        }',
  '        if (minIndex != i) {',
  '            swap(a[i], a[minIndex]);',
  '        }',
  '    }',
  '}',
];

const JAVA_SELECTION = [
  'void selectionSort(int[] a) {',
  '    int n = a.length;',
  '    for (int i = 0; i < n - 1; i++) {',
  '        int minIndex = i;',
  '        for (int j = i + 1; j < n; j++) {',
  '            // Find the smallest value',
  '            if (a[j] < a[minIndex]) {',
  '                minIndex = j;',
  '            }',
  '        }',
  '        if (minIndex != i) {',
  '            int temp = a[i];',
  '            a[i] = a[minIndex];',
  '            a[minIndex] = temp;',
  '        }',
  '    }',
  '}',
];

const JS_INSERTION = [
  'function sort(a) {',
  '  const n = a.length;',
  '  for (let i = 1; i < n; i++) {',
  '    let j = i;',
  '    while (j > 0) {',
  '      // Walk left while out of order',
  '      if (a[j - 1] <= a[j]) break;',
  '      [a[j - 1], a[j]] = [a[j], a[j - 1]];',
  '      j--;',
  '    }',
  '  }',
  '  return a;',
  '}',
];

const PY_INSERTION = [
  'def sort(a):',
  '    n = len(a)',
  '    for i in range(1, n):',
  '        j = i',
  '        while j > 0:',
  '            # Walk left while out of order',
  '            if a[j - 1] <= a[j]:',
  '                break',
  '            a[j - 1], a[j] = a[j], a[j - 1]',
  '            j -= 1',
  '    return a',
];

const CPP_INSERTION = [
  'void insertionSort(vector<int>& a) {',
  '    int n = (int)a.size();',
  '    for (int i = 1; i < n; ++i) {',
  '        int j = i;',
  '        while (j > 0) {',
  '            // Walk left while out of order',
  '            if (a[j - 1] <= a[j]) break;',
  '            swap(a[j - 1], a[j]);',
  '            --j;',
  '        }',
  '    }',
  '}',
];

const JAVA_INSERTION = [
  'void insertionSort(int[] a) {',
  '    int n = a.length;',
  '    for (int i = 1; i < n; i++) {',
  '        int j = i;',
  '        while (j > 0) {',
  '            // Walk left while out of order',
  '            if (a[j - 1] <= a[j]) break;',
  '            int temp = a[j - 1];',
  '            a[j - 1] = a[j];',
  '            a[j] = temp;',
  '            j--;',
  '        }',
  '    }',
  '}',
];

const JS_QUICK = [
  'function sort(a) {',
  '  quick(a, 0, a.length - 1);',
  '  return a;',
  '}',
  '',
  'function quick(a, lo, hi) {',
  '  if (lo >= hi) return;',
  '  const p = partition(a, lo, hi);',
  '  quick(a, lo, p - 1);',
  '  quick(a, p + 1, hi);',
  '}',
  '',
  'function partition(a, lo, hi) {',
  '  const pivot = a[hi];',
  '  let i = lo;',
  '  for (let j = lo; j < hi; j++) {',
  '    // Values below the pivot move left',
  '    if (a[j] < pivot) {',
  '      [a[i], a[j]] = [a[j], a[i]];',
  '      i++;',
  '    }',
  '  }',
  '  [a[i], a[hi]] = [a[hi], a[i]];',
  '  return i;',
  '}',
];

const PY_QUICK = [
  'def sort(a):',
  '    _quick(a, 0, len(a) - 1)',
  '    return a',
  '',
  'def _quick(a, lo, hi):',
  '    if lo >= hi:',
  '        return',
  '    p = _partition(a, lo, hi)',
  '    _quick(a, lo, p - 1)',
  '    _quick(a, p + 1, hi)',
  '',
  'def _partition(a, lo, hi):',
  '    pivot = a[hi]',
  '    i = lo',
  '    for j in range(lo, hi):',
  '        # Values below the pivot move left',
  '        if a[j] < pivot:',
  '            a[i], a[j] = a[j], a[i]',
  '            i += 1',
  '    a[i], a[hi] = a[hi], a[i]',
  '    return i',
];

const CPP_QUICK = [
  'void quickSort(vector<int>& a) {',
  '    quick(a, 0, (int)a.size() - 1);',
  '}',
  '',
  'void quick(vector<int>& a, int lo, int hi) {',
  '    if (lo >= hi) return;',
  '    int p = partition(a, lo, hi);',
  '    quick(a, lo, p - 1);',
  '    quick(a, p + 1, hi);',
  '}',
  '',
  'int partition(vector<int>& a, int lo, int hi) {',
  '    int pivot = a[hi];',
  '    int i = lo;',
  '    for (int j = lo; j < hi; ++j) {',
  '        // Values below the pivot move left',
  '        if (a[j] < pivot) {',
  '            swap(a[i], a[j]);',
  '            ++i;',
  '        }',
  '    }',
  '    swap(a[i], a[hi]);',
  '    return i;',
  '}',
];

const JAVA_QUICK = [
  'void quickSort(int[] a) {',
  '    quick(a, 0, a.length - 1);',
  '}',
  '',
  'void quick(int[] a, int lo, int hi) {',
  '    if (lo >= hi) return;',
  '    int p = partition(a, lo, hi);',
  '    quick(a, lo, p - 1);',
  '    quick(a, p + 1, hi);',
  '}',
  '',
  'int partition(int[] a, int lo, int hi) {',
  '    int pivot = a[hi];',
  '    int i = lo;',
  '    for (int j = lo; j < hi; j++) {',
  '        // Values below the pivot move left',
  '        if (a[j] < pivot) {',
  '            int temp = a[i];',
  '            a[i] = a[j];',
  '            a[j] = temp;',
  '            i++;',
  '        }',
  '    }',
  '    int last = a[i];',
  '    a[i] = a[hi];',
  '    a[hi] = last;',
  '    return i;',
  '}',
];

const RAW_SNIPPETS = {
  bubble: {
    js: {
      lines: JS_BUBBLE,
      markers: {
        init: 'function sort',
        outer: 'for (let i = 0',
        inner: 'for (let j = 0',
        compare: 'a[j] > a[j + 1]',
        swap: '[a[j], a[j + 1]]',
        done: 'return a;',
      },
    },
    python: {
      lines: PY_BUBBLE,
      markers: {
        init: 'def sort',
        outer: 'for i in range',
        inner: 'for j in range',
        compare: 'a[j] > a[j + 1]',
        swap: 'a[j], a[j + 1]',
        done: 'return a',
      },
    },
    cpp: {
      lines: CPP_BUBBLE,
      markers: {
        init: 'void bubbleSort',
        outer: 'for (int i = 0',
        inner: 'for (int j = 0',
        compare: 'a[j] > a[j + 1]',
        swap: 'swap(a[j], a[j + 1])',
        done: '}',
      },
    },
    java: {
      lines: JAVA_BUBBLE,
      markers: {
        init: 'void bubbleSort',
        outer: 'for (int i = 0',
        inner: 'for (int j = 0',
        compare: 'a[j] > a[j + 1]',
        swap: 'int temp = a[j]',
        done: '}',
      },
    },
  },
  selection: {
    js: {
      lines: JS_SELECTION,
      markers: {
        init: 'function sort',
        outer: 'for (let i = 0',
        inner: 'for (let j = i + 1',
        compare: 'a[j] < a[min]',
        min: 'min = j',
        swap: '[a[i], a[min]]',
        done: 'return a;',
      },
    },
    python: {
      lines: PY_SELECTION,
      markers: {
        init: 'def sort',
        outer: 'for i in range',
        inner: 'for j in range',
        compare: 'a[j] < a[smallest]',
        min: 'smallest = j',
        swap: 'a[i], a[smallest]',
        done: 'return a',
      },
    },
    cpp: {
      lines: CPP_SELECTION,
      markers: {
        init: 'void selectionSort',
        outer: 'for (int i = 0',
        inner: 'for (int j = i + 1',
        compare: 'a[j] < a[minIndex]',
        min: 'minIndex = j',
        swap: 'swap(a[i], a[minIndex])',
        done: '}',
      },
    },
    java: {
      lines: JAVA_SELECTION,
      markers: {
        init: 'void selectionSort',
        outer: 'for (int i = 0',
        inner: 'for (int j = i + 1',
        compare: 'a[j] < a[minIndex]',
        min: 'minIndex = j',
        swap: 'int temp = a[i]',
        done: '}',
      },
    },
  },
  insertion: {
    js: {
      lines: JS_INSERTION,
      markers: {
        init: 'function sort',
        outer: 'for (let i = 1',
        inner: 'while (j > 0)',
        compare: 'a[j - 1] <= a[j]',
        swap: '[a[j - 1], a[j]]',
        done: 'return a;',
      },
    },
    python: {
      lines: PY_INSERTION,
      markers: {
        init: 'def sort',
        outer: 'for i in range',
        inner: 'while j > 0',
        compare: 'a[j - 1] <= a[j]',
        swap: 'a[j - 1], a[j]',
        done: 'return a',
      },
    },
    cpp: {
      lines: CPP_INSERTION,
      markers: {
        init: 'void insertionSort',
        outer: 'for (int i = 1',
        inner: 'while (j > 0)',
        compare: 'a[j - 1] <= a[j]',
        swap: 'swap(a[j - 1], a[j])',
        done: '}',
      },
    },
    java: {
      lines: JAVA_INSERTION,
      markers: {
        init: 'void insertionSort',
        outer: 'for (int i = 1',
        inner: 'while (j > 0)',
        compare: 'a[j - 1] <= a[j]',
        swap: 'int temp = a[j - 1]',
        done: '}',
      },
    },
  },
  quick: {
    js: {
      lines: JS_QUICK,
      markers: {
        init: 'function sort',
        enter: 'function quick(a, lo, hi)',
        exit: 'function quick(a, lo, hi)',
        base: 'if (lo >= hi) return;',
        pivot: 'const pivot = a[hi];',
        compare: 'a[j] < pivot',
        swap: '[a[i], a[j]]',
        recurse: 'quick(a, lo, p - 1)',
        done: 'return a;',
      },
    },
    python: {
      lines: PY_QUICK,
      markers: {
        init: 'def sort',
        enter: 'def _quick(a, lo, hi)',
        exit: 'def _quick(a, lo, hi)',
        base: 'if lo >= hi:',
        pivot: 'pivot = a[hi]',
        compare: 'a[j] < pivot',
        swap: 'a[i], a[j]',
        recurse: '_quick(a, lo, p - 1)',
        done: 'return a',
      },
    },
    cpp: {
      lines: CPP_QUICK,
      markers: {
        init: 'void quickSort',
        enter: 'void quick(',
        exit: 'void quick(',
        base: 'if (lo >= hi) return;',
        pivot: 'int pivot = a[hi];',
        compare: 'a[j] < pivot',
        swap: 'swap(a[i], a[j])',
        recurse: 'quick(a, lo, p - 1)',
        done: '}',
      },
    },
    java: {
      lines: JAVA_QUICK,
      markers: {
        init: 'void quickSort',
        enter: 'void quick(',
        exit: 'void quick(',
        base: 'if (lo >= hi) return;',
        pivot: 'int pivot = a[hi];',
        compare: 'a[j] < pivot',
        swap: 'int temp = a[i]',
        recurse: 'quick(a, lo, p - 1)',
        done: '}',
      },
    },
  },
};

function prepare(entry) {
  const anchors = {};
  for (const [tag, marker] of Object.entries(entry.markers)) {
    const line = entry.lines.findIndex((value) => value.includes(marker));
    anchors[tag] = line >= 0 ? line + 1 : 1;
  }
  return {
    ...entry,
    anchors,
    code: entry.lines.join('\n'),
  };
}

export const SNIPPETS = Object.fromEntries(
  Object.entries(RAW_SNIPPETS).map(([algorithm, languages]) => [
    algorithm,
    Object.fromEntries(
      Object.entries(languages).map(([language, entry]) => [language, prepare(entry)]),
    ),
  ]),
);

export function getSnippet(algorithm, language = 'js') {
  return SNIPPETS[algorithm]?.[language] ?? SNIPPETS.bubble.js;
}

export function getLanguage(language = 'js') {
  return LANGUAGES.find((item) => item.id === language) ?? LANGUAGES[0];
}

export function getAnchorLine(algorithm, language, tag) {
  const snippet = getSnippet(algorithm, language);
  return snippet.anchors[tag] ?? 1;
}
