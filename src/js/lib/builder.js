// "Build a session": picks exercises for the areas you feel stuck in and fits
// them to the time you have.

import { EXERCISES } from '../data/exercises.js';
import { estimateSeconds, positionRank } from './session.js';

/** Small seeded random generator so a built session is stable until shuffled. */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * @param {object} o
 * @param {string[]} o.areas   body areas to focus on (empty means whole body)
 * @param {number}   o.minutes time budget
 * @param {'mix'|'moving'|'gravity'} o.style
 * @param {'mat'|'chair'} o.place
 * @param {string[]} o.care    areas to go easy on (exercises flagged for them are left out)
 * @param {number}   o.seed
 * @param {number}   o.scale   hold length multiplier used for timing
 * @returns {{id: string, sec: number}[]}
 */
export function buildCustom({ areas = [], minutes = 10, style = 'mix', place = 'mat', care = [], seed = 1, scale = 1 } = {}) {
  const budget = minutes * 60;
  const rand = seededRandom(seed);
  const want = new Set(areas);

  let pool = EXERCISES.filter((ex) => ex.kind !== 'breath');
  pool = place === 'chair'
    ? pool.filter((ex) => ex.position === 'chair' || ex.anywhere || (ex.position === 'standing' && ex.id !== 'squat'))
    : pool.filter((ex) => ex.position !== 'chair' || ex.anywhere);
  if (style === 'moving') pool = pool.filter((ex) => ex.kind === 'flow');
  if (style === 'gravity') pool = pool.filter((ex) => ex.kind === 'hold');
  const gentle = pool.filter((ex) => !ex.care.some((c) => care.includes(c)));
  if (gentle.length >= 4) pool = gentle;

  const hits = (ex) => ex.areas.filter((a) => want.has(a)).length;
  const scored = pool
    .map((ex) => ({ ex, s: (want.size ? hits(ex) * 3 : 1) + rand() * 2 }))
    .sort((a, b) => b.s - a.s);

  const picked = [];
  const has = (id) => picked.some((p) => p.id === id);
  const fits = (cand) => estimateSeconds([...picked, cand], { scale }) <= budget * 1.08;
  const add = (ex) => {
    const cand = { id: ex.id, sec: ex.sec };
    if (has(ex.id) || !fits(cand)) return false;
    picked.push(cand);
    return true;
  };

  // Warm up with one moving stretch when the style allows it.
  if (style !== 'gravity') {
    const warm = scored.find(({ ex }) => ex.kind === 'flow' && (!want.size || hits(ex)));
    if (warm) add(warm.ex);
  }
  // Make sure each chosen area gets at least one exercise.
  for (const area of want) {
    if (picked.some((p) => EXERCISES.find((e) => e.id === p.id).areas.includes(area))) continue;
    const best = scored.find(({ ex }) => ex.areas.includes(area) && !has(ex.id));
    if (best) add(best.ex);
  }
  // Fill the rest of the time, focus areas first, then anything useful.
  const closing = place === 'mat' && style !== 'moving' && minutes >= 10 ? EXERCISES.find((e) => e.id === 'floormelt') : null;
  const reserve = closing ? closing.sec + 8 : 0;
  for (const { ex } of scored) {
    if (estimateSeconds(picked, { scale }) >= budget - reserve - 30) break;
    if (ex === closing) continue;
    if (want.size && !hits(ex)) continue;
    if (estimateSeconds([...picked, { id: ex.id, sec: ex.sec }], { scale }) > budget - reserve + 20) continue;
    add(ex);
  }
  for (const { ex } of scored) {
    if (estimateSeconds(picked, { scale }) >= budget - reserve - 30) break;
    if (ex === closing) continue;
    if (estimateSeconds([...picked, { id: ex.id, sec: ex.sec }], { scale }) > budget - reserve + 20) continue;
    add(ex);
  }

  // Order so you move from standing down to the floor, flows before holds.
  const byId = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));
  picked.sort((a, b) => {
    const ea = byId[a.id];
    const eb = byId[b.id];
    const warmA = ea.kind === 'flow' ? 0 : 1;
    const warmB = eb.kind === 'flow' ? 0 : 1;
    return positionRank(ea.position) - positionRank(eb.position) || warmA - warmB;
  });
  if (closing && !has(closing.id)) picked.push({ id: closing.id, sec: closing.sec });

  // Few exercises for a long session (e.g. moving only): stretch each one to fill the time.
  const total = estimateSeconds(picked, { scale });
  if (picked.length && total < budget * 0.85) {
    const moving = total - picked.reduce((a, p) => a + p.sec * (byId[p.id].sides ? 2 : 1) * scale, 0);
    const poseTime = total - moving;
    const f = Math.min(2, (budget - moving) / poseTime);
    for (const p of picked) p.sec = Math.round((p.sec * f) / 5) * 5;
  }
  return picked;
}
