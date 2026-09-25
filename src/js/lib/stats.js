// Progress numbers derived from the practice log. Pure functions: they take
// the stored state (or parts of it) and today's day key.

import { addDays, weekStart, daysBetween } from './dates.js';
import { EXERCISE } from '../data/exercises.js';
import { PROGRAM } from '../data/program.js';

/** A day counts once you have practised at least this long. */
export const MIN_PRACTICE_SEC = 60;

function secondsByDay(sessions) {
  const m = new Map();
  for (const s of sessions) m.set(s.day, (m.get(s.day) || 0) + (s.sec || 0));
  return m;
}

export function practiceDays(sessions) {
  const out = new Set();
  for (const [d, sec] of secondsByDay(sessions)) if (sec >= MIN_PRACTICE_SEC) out.add(d);
  return out;
}

/**
 * Current streak. A streak stays alive through today until midnight: if you
 * practised yesterday but not yet today, it still counts, and `today` is false.
 */
export function streak(sessions, today) {
  const days = practiceDays(sessions);
  const yesterday = addDays(today, -1);
  const start = days.has(today) ? today : days.has(yesterday) ? yesterday : null;
  if (!start) return { days: 0, today: false };
  let n = 0;
  for (let d = start; days.has(d); d = addDays(d, -1)) n++;
  return { days: n, today: days.has(today) };
}

export function longestStreak(sessions) {
  const days = [...practiceDays(sessions)].sort();
  let best = 0;
  let run = 0;
  let prev = null;
  for (const d of days) {
    run = prev && daysBetween(prev, d) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

/** Monday to Sunday of the current week. */
export function week(sessions, today) {
  const start = weekStart(today);
  const days = practiceDays(sessions);
  const secs = secondsByDay(sessions);
  return Array.from({ length: 7 }, (_, i) => {
    const key = addDays(start, i);
    return { key, done: days.has(key), minutes: Math.round((secs.get(key) || 0) / 60), today: key === today, future: key > today };
  });
}

export function totals(sessions) {
  const sec = sessions.reduce((a, s) => a + (s.sec || 0), 0);
  return { sessions: sessions.length, minutes: Math.round(sec / 60), days: practiceDays(sessions).size };
}

/** Minutes per week for the last `n` weeks, oldest first. */
export function weeklyMinutes(sessions, today, n = 8) {
  const secs = secondsByDay(sessions);
  const thisWeek = weekStart(today);
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const ws = addDays(thisWeek, -7 * i);
    let sec = 0;
    for (let j = 0; j < 7; j++) sec += secs.get(addDays(ws, j)) || 0;
    out.push({ week: ws, minutes: Math.round(sec / 60) });
  }
  return out;
}

/** Days practised in each of the last `n` weeks (0 to 7). */
export function weeklyDays(sessions, today, n = 8) {
  const days = practiceDays(sessions);
  const thisWeek = weekStart(today);
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const ws = addDays(thisWeek, -7 * i);
    let c = 0;
    for (let j = 0; j < 7; j++) if (days.has(addDays(ws, j))) c++;
    out.push({ week: ws, days: c });
  }
  return out;
}

/** Sessions with a before-and-after tension rating, oldest first, plus averages. */
export function tension(sessions) {
  const rows = sessions
    .filter((s) => Number.isFinite(s.before) && Number.isFinite(s.after))
    .sort((a, b) => a.t - b.t);
  if (!rows.length) return { rows, avgBefore: null, avgAfter: null, avgDrop: null };
  const avg = (f) => rows.reduce((a, r) => a + f(r), 0) / rows.length;
  return {
    rows,
    avgBefore: avg((r) => r.before),
    avgAfter: avg((r) => r.after),
    avgDrop: avg((r) => r.before - r.after),
  };
}

/** Seconds of practice per body area, most worked first. */
export function areaSeconds(sessions) {
  const m = new Map();
  for (const s of sessions) {
    for (const [id, sec] of Object.entries(s.ex || {})) {
      const ex = EXERCISE[id];
      if (!ex || !ex.areas.length) continue;
      for (const a of ex.areas) m.set(a, (m.get(a) || 0) + sec / ex.areas.length);
    }
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([area, sec]) => ({ area, sec }));
}

/** How often each body area was marked as tight, in the last `n` check-ins. */
export function stuckSpots(sessions, n = 10) {
  const recent = sessions.filter((s) => s.stuck && s.stuck.length).sort((a, b) => b.t - a.t).slice(0, n);
  const m = new Map();
  for (const s of recent) for (const a of s.stuck) m.set(a, (m.get(a) || 0) + 1);
  return { count: recent.length, spots: [...m.entries()].sort((a, b) => b[1] - a[1]).map(([area, times]) => ({ area, times })) };
}

// ---------- the 30-day plan ----------

export function programStatus(program = {}, today) {
  const done = program.done || {};
  const total = PROGRAM.days.length;
  let next = null;
  for (let d = 1; d <= total; d++) {
    if (!done[d]) {
      next = d;
      break;
    }
  }
  const count = Object.keys(done).filter((d) => d >= 1 && d <= total).length;
  const doneToday = Object.values(done).includes(today);
  return { next, count, total, doneToday, finished: next === null, started: count > 0 || !!program.startedAt };
}

// ---------- flexibility checks ----------

/** Per test: first and latest result, and the change between them. */
export function testProgress(tests) {
  const sorted = [...tests].sort((a, b) => a.t - b.t);
  const out = {};
  for (const entry of sorted) {
    for (const [id, level] of Object.entries(entry.results || {})) {
      if (!Number.isFinite(level)) continue;
      if (!out[id]) out[id] = { first: level, latest: level, history: [] };
      out[id].latest = level;
      out[id].history.push({ day: entry.day, level });
    }
  }
  for (const v of Object.values(out)) v.change = v.latest - v.first;
  return out;
}

/** Days since the last check, or null when there has not been one. */
export function daysSinceCheck(tests, today) {
  if (!tests.length) return null;
  const last = tests.reduce((a, b) => (a.t > b.t ? a : b));
  return daysBetween(last.day, today);
}

// ---------- badges ----------

export const BADGES = [
  { id: 'first', name: 'First stretch', desc: 'Finish your first session' },
  { id: 'streak3', name: 'Three in a row', desc: 'Practise three days in a row' },
  { id: 'streak7', name: 'One full week', desc: 'Practise seven days in a row' },
  { id: 'streak14', name: 'Two weeks strong', desc: 'Practise 14 days in a row' },
  { id: 'streak30', name: 'Thirty straight', desc: 'Practise 30 days in a row' },
  { id: 'sessions10', name: 'Ten sessions', desc: 'Finish 10 sessions' },
  { id: 'sessions50', name: 'Fifty sessions', desc: 'Finish 50 sessions' },
  { id: 'hour1', name: 'First hour', desc: '60 minutes of practice in total' },
  { id: 'hour10', name: 'Ten hours', desc: '600 minutes of practice in total' },
  { id: 'gravity5', name: 'Gravity fan', desc: 'Five sessions that are mostly gravity holds' },
  { id: 'calm', name: 'Tension tamer', desc: 'Drop your tension by 3 or more in one session' },
  { id: 'check1', name: 'Baseline set', desc: 'Do your first flexibility check' },
  { id: 'looser', name: 'Measurably looser', desc: 'Improve on any flexibility check' },
  { id: 'week1', name: 'Week one done', desc: 'Finish days 1 to 7 of Unstuck 30' },
  { id: 'program', name: 'Unstuck', desc: 'Finish all 30 days of Unstuck 30' },
];

function mostlyGravity(s) {
  let hold = 0;
  let all = 0;
  for (const [id, sec] of Object.entries(s.ex || {})) {
    const ex = EXERCISE[id];
    if (!ex) continue;
    all += sec;
    if (ex.kind === 'hold') hold += sec;
  }
  return all > 0 && hold / all >= 0.6;
}

/** Map of badge id -> day it was earned (only earned badges appear). */
export function earnedBadges(state) {
  const earned = {};
  const give = (id, day) => {
    if (!earned[id] && day) earned[id] = day;
  };
  const sessions = [...(state.sessions || [])].sort((a, b) => a.t - b.t);
  let count = 0;
  let sec = 0;
  let gravity = 0;
  const days = new Set();
  let run = 0;
  let prevDay = null;
  const daySec = new Map();
  for (const s of sessions) {
    count++;
    sec += s.sec || 0;
    if (mostlyGravity(s)) gravity++;
    daySec.set(s.day, (daySec.get(s.day) || 0) + (s.sec || 0));
    if (!days.has(s.day) && daySec.get(s.day) >= MIN_PRACTICE_SEC) {
      days.add(s.day);
      run = prevDay && daysBetween(prevDay, s.day) === 1 ? run + 1 : 1;
      prevDay = s.day;
    }
    give('first', s.day);
    if (run >= 3) give('streak3', s.day);
    if (run >= 7) give('streak7', s.day);
    if (run >= 14) give('streak14', s.day);
    if (run >= 30) give('streak30', s.day);
    if (count >= 10) give('sessions10', s.day);
    if (count >= 50) give('sessions50', s.day);
    if (sec >= 3600) give('hour1', s.day);
    if (sec >= 36000) give('hour10', s.day);
    if (gravity >= 5) give('gravity5', s.day);
    if (Number.isFinite(s.before) && Number.isFinite(s.after) && s.before - s.after >= 3) give('calm', s.day);
  }
  const tests = [...(state.tests || [])].sort((a, b) => a.t - b.t);
  const firstLevel = {};
  for (const t of tests) {
    give('check1', t.day);
    for (const [id, level] of Object.entries(t.results || {})) {
      if (!Number.isFinite(level)) continue;
      if (firstLevel[id] === undefined) firstLevel[id] = level;
      else if (level > firstLevel[id]) give('looser', t.day);
    }
  }
  const done = (state.program && state.program.done) || {};
  const doneDates = (from, to) => {
    const ds = [];
    for (let d = from; d <= to; d++) {
      if (!done[d]) return null;
      ds.push(done[d]);
    }
    return ds.sort().pop();
  };
  give('week1', doneDates(1, 7));
  give('program', doneDates(1, PROGRAM.days.length));
  return earned;
}
