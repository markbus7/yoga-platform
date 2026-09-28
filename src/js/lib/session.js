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

/** Sessions with at least this many seconds in an exercise count as having done it. */
const DONE_SEC = 15;
/** "Until I know it" shows the how-to for your first few times. */
export const DEMO_TIMES = 3;

export function timesDone(sessions, id) {
  return sessions.filter((s) => s.ex && s.ex[id] >= DONE_SEC).length;
}

/** Should the player stop and show how to do this exercise before timing it? */
export function needsDemo(id, settings, sessions) {
  if (settings.demo === 'off') return false;
  if (settings.demo === 'always') return true;
  return !settings.known.includes(id) && timesDone(sessions, id) < DEMO_TIMES;
}

/** Positions where your weight is on your feet or toes: no toe spreaders there. */
const ON_FEET = new Set(['standing', 'kneeling', 'allfours']);

/**
 * Build the step list.
 *   move    get into the next exercise (longer when the position changes)
 *   pose    an exercise, or one side of it
 *   switch  come out and set up the other side
 *   rest    come out of the pose you just held and rest, before the next move
 *
 * With `spreaders`, the step before the first hold where your feet are free
 * says to put toe spreaders in (with extra time), and the step before you
 * stand or kneel again says to take them out: `gear: 'on' | 'off'`. The move
 * steps in between carry `spreadersIn` so the screen can show it.
 */
export function buildTimeline(items, { scale = 1, transition = 8, spreaders = false } = {}) {
  const steps = [];
  let prev = null;
  for (const it of items) {
    const ex = EXERCISE[it.id];
    if (!ex) continue;
    const sec = scaledSeconds(ex, it.sec, scale);
    if (prev) steps.push({ type: 'rest', ex: prev, next: ex, sec: restSeconds(prev, transition) });
    const moveSec = !prev ? Math.max(6, transition - 1) : prev.position !== ex.position ? transition + 3 : transition;
    steps.push({ type: 'move', ex, sec: moveSec, first: !prev });
    if (ex.sides) {
      steps.push({ type: 'pose', ex, side: 0, sec });
      steps.push({ type: 'switch', ex, sec: ex.kind === 'hold' ? transition + 2 : Math.max(5, transition - 2) });
      steps.push({ type: 'pose', ex, side: 1, sec });
    } else {
      steps.push({ type: 'pose', ex, side: null, sec });
    }
    prev = ex;
  }
  if (spreaders) planSpreaders(steps);
  return steps;
}

/** Holds end with a proper rest; after moving or breathing a short pause is enough. */
function restSeconds(ex, transition) {
  return ex.kind === 'hold' ? transition : Math.max(3, Math.round(transition / 2));
}

function planSpreaders(steps) {
  let on = false;
  steps.forEach((st, i) => {
    if (st.type !== 'move') return;
    const want = st.ex.spreaders ? true : ON_FEET.has(st.ex.position) ? false : on;
    if (want !== on) {
      const before = steps[i - 1] && steps[i - 1].type === 'rest' ? steps[i - 1] : st;
      before.gear = want ? 'on' : 'off';
      before.sec += want ? 15 : 8;
      on = want;
    }
    st.spreadersIn = on;
  });
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
