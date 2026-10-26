/**
 * Event contract for the scroll sequence story.
 *
 * One product question: when visitors scroll the sequence, how far do they get
 * and where do they drop off between the first frame and the final one?
 */

import { sanitizeProperties } from './posthog.mjs';

export const EVENTS = Object.freeze({
  STARTED: 'scroll_sequence_started',
  CHECKPOINT: 'scroll_sequence_checkpoint',
  COMPLETED: 'scroll_sequence_completed',
});

/** Depth checkpoints, in percent of the scrollable sequence. */
export const CHECKPOINT_DEPTHS = Object.freeze([25, 50, 75]);

export const START_DEPTH_PERCENT = 5;
export const COMPLETE_DEPTH_PERCENT = 95;

/** The only properties each event may carry. */
export const EVENT_PROPERTIES = Object.freeze({
  [EVENTS.STARTED]: Object.freeze({ reduced_motion: 'boolean' }),
  [EVENTS.CHECKPOINT]: Object.freeze({ depth_percent: 'number', reduced_motion: 'boolean' }),
  [EVENTS.COMPLETED]: Object.freeze({ reduced_motion: 'boolean' }),
});

function clampPercent(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

/** Turns raw scroll measurements into a 0-100 depth through the sequence. */
export function readScrollDepth(scrollY, viewportHeight, documentHeight) {
  const values = [Number(scrollY), Number(viewportHeight), Number(documentHeight)];
  if (!values.every(Number.isFinite)) return 0;
  const scrollable = values[2] - values[1];
  if (!(scrollable > 0)) return 100;
  return clampPercent((values[0] / scrollable) * 100);
}

/**
 * Emits the contract at most once per action for one page view.
 * `capture` is the analytics client's capture; failures there are already
 * swallowed, and this tracker never throws into a scroll handler.
 */
export function createScrollSequenceTracker({ capture, reducedMotion = false } = {}) {
  const started = { done: false };
  const completed = { done: false };
  const checkpoints = new Set();
  const safeReducedMotion = reducedMotion === true;

  function emit(pending) {
    if (!pending.length) return 0;
    let emitted = 0;
    for (const [event, properties] of pending) {
      if (typeof capture !== 'function') continue;
      try {
        const delivered = capture(event, sanitizeProperties(properties, EVENT_PROPERTIES[event]));
        if (delivered !== false) emitted += 1;
      } catch {
        // Analytics must never break the animation.
      }
    }
    return emitted;
  }

  function track(depthPercent) {
    const depth = clampPercent(depthPercent);
    const pending = [];

    if (!started.done && depth >= START_DEPTH_PERCENT) {
      started.done = true;
      pending.push([EVENTS.STARTED, { reduced_motion: safeReducedMotion }]);
    }

    for (const checkpoint of CHECKPOINT_DEPTHS) {
      if (depth >= checkpoint && !checkpoints.has(checkpoint)) {
        checkpoints.add(checkpoint);
        pending.push([
          EVENTS.CHECKPOINT,
          { depth_percent: checkpoint, reduced_motion: safeReducedMotion },
        ]);
      }
    }

    if (started.done && !completed.done && depth >= COMPLETE_DEPTH_PERCENT) {
      completed.done = true;
      pending.push([EVENTS.COMPLETED, { reduced_motion: safeReducedMotion }]);
    }

    return emit(pending);
  }

  function getState() {
    return {
      started: started.done,
      completed: completed.done,
      checkpoints: [...checkpoints].sort((a, b) => a - b),
    };
  }

  return { track, getState };
}
