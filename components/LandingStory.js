'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { buildTrace, DEFAULT_ARRAY } from '@/lib/algorithms';

/**
 * The landing page's scroll sequence: a sticky canvas replays a real bubble
 * sort trace for the default array as the visitor scrolls, chapter by chapter.
 * Counters are written straight into the DOM so scrolling stays at one frame
 * per scroll event without re-rendering React on every step.
 */

const CHAPTERS = [
  {
    id: 'intro',
    kicker: 'AlgoViz · algorithm laboratory',
    title: ['Sorting,', 'made visible.'],
    body: 'Every comparison, every write, every pivot — replayed frame by frame, right here in your browser.',
    actions: true,
  },
  {
    id: 'compare',
    kicker: 'Chapter 01 · comparisons',
    title: ['Watch the', 'work happen.'],
    body: 'This is the exact trace the lab plays: the same twelve numbers, the same hundred steps. Scroll to drive it.',
  },
  {
    id: 'write',
    kicker: 'Chapter 02 · writes',
    title: ['Every swap,', 'accounted for.'],
    body: 'Comparisons, writes and swaps are counted live, so O(n²) stops being a symbol and starts being a number.',
  },
  {
    id: 'bigo',
    kicker: 'Chapter 03 · complexity',
    title: ['Then race it', 'against Quick.'],
    body: 'Pit any two algorithms on one array and watch the operation gap open up in real time.',
    actions: true,
  },
];

const CHAPTER_STOPS = [0, 0.24, 0.5, 0.76];
const MONO =
  'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height);
  ctx.lineTo(x, y + height);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Paint the frame of the trace that `progress` (0..1) points at. */
function drawFrame(canvas, steps, progress) {
  if (!canvas || typeof canvas.getBoundingClientRect !== 'function') return null;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  if (width < 2 || height < 2) return null;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const targetWidth = Math.floor(width * dpr);
  const targetHeight = Math.floor(height * dpr);
  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const lastIndex = steps.length - 1;
  const index = Math.round(clamp(progress, 0, 1) * lastIndex);
  const step = steps[index];
  const values = step.array;
  const count = values.length;
  const max = Math.max(...values.map((value) => Math.abs(value)), 1);

  const padX = Math.max(22, width * 0.06);
  const baseY = height * 0.8;
  const topY = height * 0.26;
  const slot = (width - padX * 2) / count;
  const barWidth = Math.max(4, slot * 0.58);
  const active = new Set(step.indices);

  // ground line
  ctx.strokeStyle = 'rgba(233, 227, 215, 0.14)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padX, baseY + 0.5);
  ctx.lineTo(width - padX, baseY + 0.5);
  ctx.stroke();

  for (let i = 0; i < count; i += 1) {
    const value = values[i];
    const barHeight = Math.max(3, ((Math.abs(value) + 1) / (max + 1)) * (baseY - topY));
    const x = padX + slot * i + (slot - barWidth) / 2;
    const y = baseY - barHeight;
    const isActive = active.has(i);

    ctx.fillStyle = isActive
      ? step.action === 'swap'
        ? '#d47a6a'
        : '#e6b36a'
      : 'rgba(208, 138, 90, 0.5)';
    roundRect(ctx, x, y, barWidth, barHeight, Math.min(7, barWidth / 2.6));
    ctx.fill();

    ctx.strokeStyle = isActive ? 'rgba(238, 232, 220, 0.9)' : 'rgba(233, 227, 215, 0.2)';
    ctx.lineWidth = isActive ? 1.6 : 1;
    ctx.stroke();

    if (slot > 20) {
      ctx.fillStyle = isActive ? '#eee8dc' : 'rgba(182, 171, 157, 0.85)';
      ctx.font = `${Math.min(13, Math.max(9, Math.floor(slot * 0.34)))}px ${MONO}`;
      ctx.textAlign = 'center';
      ctx.fillText(String(value), x + barWidth / 2, y - 7);
    }
  }

  return step;
}

export default function LandingStory() {
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const compareRef = useRef(null);
  const writeRef = useRef(null);
  const swapRef = useRef(null);
  const progressRef = useRef(0);
  const chapterRef = useRef(0);

  const [chapter, setChapter] = useState(0);
  const [staticMode, setStaticMode] = useState(false);

  const trace = useMemo(() => buildTrace('bubble', DEFAULT_ARRAY), []);
  const steps = trace.steps;

  const paint = (progress) => {
    const step = drawFrame(canvasRef.current, steps, progress);
    if (!step) return;
    if (compareRef.current) compareRef.current.textContent = String(step.comparisons);
    if (writeRef.current) writeRef.current.textContent = String(step.writes);
    if (swapRef.current) swapRef.current.textContent = String(step.swaps);
  };

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setStaticMode(media.matches);
    apply();
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', apply);
      return () => media.removeEventListener('change', apply);
    }
    return undefined;
  }, []);

  // Initial paint (and repaint whenever static mode toggles).
  useEffect(() => {
    paint(staticMode ? 1 : progressRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staticMode, steps]);

  useEffect(() => {
    if (staticMode) return undefined;

    let lastRun = 0;
    let trailing = 0;

    const update = () => {
      lastRun = performance.now();
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const travel = Math.max(1, section.offsetHeight - window.innerHeight);
      const progress = clamp(-rect.top / travel, 0, 1);
      progressRef.current = progress;
      paint(progress);

      let nextChapter = 0;
      for (let i = 0; i < CHAPTER_STOPS.length; i += 1) {
        if (progress >= CHAPTER_STOPS[i]) nextChapter = i;
      }
      if (nextChapter !== chapterRef.current) {
        chapterRef.current = nextChapter;
        setChapter(nextChapter);
      }
    };

    // Scroll updates are time-throttled instead of rAF-driven: rAF never runs
    // in backgrounded or headless tabs, which would freeze the story exactly
    // when a visitor scrolls back to it. The trailing timer guarantees the
    // final position is always painted.
    const onScroll = () => {
      const now = performance.now();
      if (now - lastRun >= 32) {
        update();
        return;
      }
      if (trailing) return;
      trailing = window.setTimeout(() => {
        trailing = 0;
        update();
      }, 40);
    };

    const onResize = () => paint(progressRef.current);

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (trailing) window.clearTimeout(trailing);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staticMode, steps]);

  return (
    <section
      className={`story ${staticMode ? 'is-static' : ''}`}
      ref={sectionRef}
      aria-label="Sorting story"
    >
      <div className="story-sticky">
        <canvas className="story-canvas" ref={canvasRef} aria-hidden="true" />
        <div className="story-vignette" aria-hidden="true" />

        <div className="story-overlay">
          <div className="story-chapters">
            {CHAPTERS.map((item, index) => (
              <article
                key={item.id}
                className={`story-chapter ${index === chapter ? 'is-active' : ''}`}
                aria-hidden={staticMode ? undefined : index !== chapter}
              >
                <p className="eyebrow">{item.kicker}</p>
                {index === 0 ? (
                  <h1 className="story-title">
                    {item.title[0]}
                    <br />
                    {item.title[1]}
                  </h1>
                ) : (
                  <h2 className="story-title">
                    {item.title[0]}
                    <br />
                    {item.title[1]}
                  </h2>
                )}
                <p className="story-body">{item.body}</p>
                {item.actions && (
                  <div className="story-actions">
                    <a
                      className="btn btn-primary"
                      href="/app#lab"
                      tabIndex={staticMode || index === chapter ? 0 : -1}
                    >
                      Open the lab
                    </a>
                    <a
                      className="btn btn-outline"
                      href="/app#race"
                      tabIndex={staticMode || index === chapter ? 0 : -1}
                    >
                      Watch a race
                    </a>
                  </div>
                )}
              </article>
            ))}
          </div>

          <div className="story-hud" aria-hidden="true">
            <span>
              <b ref={compareRef}>0</b> comparisons
            </span>
            <span>
              <b ref={writeRef}>0</b> writes
            </span>
            <span>
              <b ref={swapRef}>0</b> swaps
            </span>
          </div>

          <ol className="story-rail" aria-hidden="true">
            {CHAPTERS.map((item, index) => (
              <li key={item.id} className={index <= chapter ? 'is-passed' : ''} />
            ))}
          </ol>

          <p className="story-scrollhint" aria-hidden="true">
            Scroll to replay the trace
          </p>
        </div>
      </div>
    </section>
  );
}
