/**
 * Student code runs in a dedicated Web Worker. The array is wrapped in a Proxy
 * so ordinary code such as `if (a[j] > a[j + 1])` produces comparison and write
 * events without asking learners to learn a custom API.
 *
 * This is an experimentation sandbox, not a security boundary: it prevents DOM
 * access and cuts off network globals, but it executes JavaScript. Never use it
 * for untrusted third-party submissions.
 */

const MAX_CODE_LENGTH = 20_000;
const MAX_STEPS = 3000;
const TIMEOUT_MS = 3000;

function sandboxMain() {
  const INDEX = /^(0|[1-9]\d*)$/;

  self.fetch = () => {
    throw new Error('Network access is disabled inside the code sandbox.');
  };
  self.XMLHttpRequest = undefined;
  self.WebSocket = undefined;
  self.EventSource = undefined;
  self.importScripts = () => {
    throw new Error('Importing scripts is disabled inside the code sandbox.');
  };

  self.onmessage = (event) => {
    const { code, values, maxSteps } = event.data;
    const started = performance.now();

    try {
      const array = values.slice();
      const steps = [];
      let comparisons = 0;
      let writes = 0;
      let swaps = 0;
      let pendingRead = -1;
      let lastWrite = null;

      const snapshot = (action, indices, note) => {
        if (steps.length >= maxSteps) {
          throw new Error('The trace limit was reached. Check for an infinite loop.');
        }
        steps.push({
          array: array.slice(),
          action,
          indices,
          tag: 'custom',
          note,
          comparisons,
          writes,
          swaps,
          depth: 0,
          maxDepth: 0,
        });
      };

      snapshot('init', [], 'Your code, traced locally.');

      const tracked = new Proxy(array, {
        get(target, property) {
          if (typeof property === 'string' && INDEX.test(property)) {
            const index = Number(property);
            if (index < target.length) {
              if (pendingRead >= 0 && pendingRead !== index) {
                comparisons += 1;
                snapshot(
                  'compare',
                  [pendingRead, index],
                  'Compare a[' + pendingRead + '] = ' + target[pendingRead] + ' with a[' + index + '] = ' + target[index] + '.',
                );
                pendingRead = -1;
              } else {
                pendingRead = index;
              }
            }
          }
          return Reflect.get(target, property);
        },
        set(target, property, value) {
          if (typeof property === 'string' && INDEX.test(property)) {
            const index = Number(property);
            const previous = target[index];
            target[index] = value;
            writes += 1;
            pendingRead = -1;
            snapshot('write', [index], 'Write ' + value + ' to a[' + index + '].');

            const reversed =
              lastWrite &&
              lastWrite.index !== index &&
              lastWrite.before === value &&
              lastWrite.after === previous &&
              performance.now() - lastWrite.at < 50;

            if (reversed) {
              swaps += 1;
              lastWrite = null;
            } else {
              lastWrite = { index, before: previous, after: value, at: performance.now() };
            }
            return true;
          }
          return Reflect.set(target, property, value);
        },
      });

      const runner = new Function(
        '__arr',
        '"use strict";\n' +
          code +
          '\nif (typeof sort !== "function") { throw new Error("Define a function named sort(a)."); }\nreturn sort(__arr);',
      );

      runner(tracked);

      const sorted = array.every((value, index) => index === 0 || array[index - 1] <= value);
      snapshot(
        'done',
        [],
        sorted
          ? 'Your code sorted the array.'
          : 'Your code finished, but the array is not in ascending order.',
      );

      self.postMessage({
        ok: true,
        steps,
        final: array.slice(),
        comparisons,
        writes,
        swaps,
        sorted,
        duration: Math.round(performance.now() - started),
      });
    } catch (error) {
      self.postMessage({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };
}

const WORKER_SOURCE = `(${sandboxMain.toString()})();`;

/**
 * Execute learner code with a hard timeout. Returns a trace-shaped result or a
 * readable error; it never throws for user mistakes.
 */
export function runUserCode({ code, values }) {
  if (typeof Worker === 'undefined' || typeof Blob === 'undefined') {
    return Promise.resolve({ error: 'This browser does not support the code sandbox.' });
  }

  const source = String(code ?? '');
  if (!source.trim()) {
    return Promise.resolve({ error: 'Write a sort(a) function before running.' });
  }
  if (source.length > MAX_CODE_LENGTH) {
    return Promise.resolve({ error: 'The code is too long for the sandbox (20,000 character limit).' });
  }
  if (!Array.isArray(values) || values.length === 0) {
    return Promise.resolve({ error: 'The current array is empty.' });
  }

  let worker;
  let objectUrl;

  return new Promise((resolve) => {
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (worker) worker.terminate();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      resolve(result);
    };

    const timer = setTimeout(() => {
      finish({ error: 'Your code took longer than 3 seconds and was stopped.' });
    }, TIMEOUT_MS);

    try {
      objectUrl = URL.createObjectURL(new Blob([WORKER_SOURCE], { type: 'text/javascript' }));
      worker = new Worker(objectUrl);

      worker.onmessage = (event) => {
        const data = event.data;
        if (!data?.ok) {
          finish({ error: data?.error || 'The sandbox could not run that code.' });
          return;
        }
        finish({
          steps: data.steps,
          final: data.final,
          comparisons: data.comparisons,
          writes: data.writes,
          swaps: data.swaps,
          maxDepth: 0,
          sorted: data.sorted,
          duration: data.duration,
        });
      };

      worker.onerror = (event) => {
        finish({ error: event.message || 'The sandbox stopped unexpectedly.' });
      };

      worker.postMessage({
        code: source,
        values: values.slice(),
        maxSteps: MAX_STEPS,
      });
    } catch (error) {
      finish({ error: error instanceof Error ? error.message : 'The sandbox could not start.' });
    }
  });
}
