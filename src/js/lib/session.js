// Turns a list of exercises into a timed step list the player can run.

import { EXERCISE } from '../data/exercises.js';

export const HOLD_LENGTHS = [
  { id: 0.75, name: 'Short', about: 'Shorter holds for busy days' },
  { id: 1, name: 'Standard', about: 'The default times' },
  { id: 1.35, name: 'Long', about: 'Longer gravity holds' },
];

const round5 = (s) => Math.max(10, Math.round(s / 5) * 5);

/** Seconds for one side of an exercise after applying hold scaling. */
export function scaledSeconds(ex, sec, scale = 1) {
  const base = sec ?? ex.sec;
  if (ex.kind === 'breath') return base;
  if (ex.kind === 'flow') return round5(base * (1 + (scale - 1) * 0.4));
  return round5(base * scale);
}

/** A routine's items as [{id, sec}]. */
export function routineItems(routine) {
  return routine.items.map(([id, sec]) => ({ id, sec }));
}

const POSITION_ORDER = ['standing', 'chair', 'allfours', 'kneeling', 'seated', 'belly', 'back'];
export function positionRank(p) {
  const i = POSITION_ORDER.indexOf(p);
  return i < 0 ? POSITION_ORDER.length : i;
}

/**
 * Build the step list.
 *   pose    an exercise (or one side of it)
 *   switch  a short pause to change sides
 *   move    time to get into the next exercise (longer when the position changes)
 */
export function buildTimeline(items, { scale = 1, transition = 8 } = {}) {
  const steps = [];
  let prevPos = null;
  items.forEach((it, idx) => {
    const ex = EXERCISE[it.id];
    if (!ex) return;
    const sec = scaledSeconds(ex, it.sec, scale);
    const changing = prevPos !== null && prevPos !== ex.position;
    const moveSec = idx === 0 ? Math.max(6, transition - 1) : changing ? transition + 3 : transition;
    steps.push({ type: 'move', ex, sec: moveSec, first: idx === 0 });
    if (ex.sides) {
      steps.push({ type: 'pose', ex, side: 0, sec });
      steps.push({ type: 'switch', ex, sec: 5 });
      steps.push({ type: 'pose', ex, side: 1, sec });
    } else {
      steps.push({ type: 'pose', ex, side: null, sec });
    }
    prevPos = ex.position;
  });
  return steps;
}

export function timelineSeconds(steps) {
  return steps.reduce((a, s) => a + s.sec, 0);
}

/** Planned practice time for a list of items, including moves between them. */
export function estimateSeconds(items, opts) {
  return timelineSeconds(buildTimeline(items, opts));
}

/** Body areas covered by a list of items, most-worked first. */
export function areasOf(items) {
  const count = new Map();
  for (const it of items) {
    const ex = EXERCISE[it.id];
    if (!ex) continue;
    const w = ex.sides ? 2 : 1;
    for (const a of ex.areas) count.set(a, (count.get(a) || 0) + w);
  }
  return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([a]) => a);
}
