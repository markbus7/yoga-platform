import { test } from 'node:test';
import assert from 'node:assert/strict';
import { streak, longestStreak, week, totals, weeklyMinutes, tension, programStatus, earnedBadges, testProgress, practiceDays, stuckSpots } from '../src/js/lib/stats.js';
import { addDays } from '../src/js/lib/dates.js';

const today = '2026-09-25'; // a Friday
let n = 0;
const s = (day, sec = 600, extra = {}) => ({ id: 's' + ++n, day, t: Date.parse(day + 'T20:00:00') + n, sec, ex: { child: sec }, ...extra });

test('short sessions do not count as a practice day', () => {
  assert.equal(practiceDays([s(today, 30)]).size, 0);
  assert.equal(practiceDays([s(today, 30), s(today, 40)]).size, 1);
});

test('streak counts back from today', () => {
  const log = [s(today), s(addDays(today, -1)), s(addDays(today, -2)), s(addDays(today, -4))];
  assert.deepEqual(streak(log, today), { days: 3, today: true });
});

test('streak is still alive before you practise today', () => {
  const log = [s(addDays(today, -1)), s(addDays(today, -2))];
  assert.deepEqual(streak(log, today), { days: 2, today: false });
});

test('streak breaks after a missed day', () => {
  assert.deepEqual(streak([s(addDays(today, -2))], today), { days: 0, today: false });
});

test('longest streak', () => {
  const log = ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-10', '2026-09-11'].map((d) => s(d));
  assert.equal(longestStreak(log), 3);
});

test('week runs Monday to Sunday and marks today and future days', () => {
  const w = week([s('2026-09-22'), s(today)], today);
  assert.equal(w[0].key, '2026-09-21');
  assert.equal(w[6].key, '2026-09-27');
  assert.deepEqual(w.map((d) => d.done), [false, true, false, false, true, false, false]);
  assert.ok(w[4].today);
  assert.ok(w[5].future);
});

test('totals and weekly minutes', () => {
  const log = [s(today, 600), s(today, 300), s(addDays(today, -7), 1200)];
  assert.deepEqual(totals(log), { sessions: 3, minutes: 35, days: 2 });
  const wm = weeklyMinutes(log, today, 3);
  assert.deepEqual(wm.map((w) => w.minutes), [0, 20, 15]);
});

test('tension averages only use sessions with both ratings', () => {
  const t = tension([s(today, 600, { before: 7, after: 4 }), s(today, 600, { before: 5, after: 4 }), s(today, 600, { before: 6 })]);
  assert.equal(t.rows.length, 2);
  assert.equal(t.avgDrop, 2);
});

test('program status finds the next day and whether today is done', () => {
  assert.deepEqual(programStatus({}, today), { next: 1, count: 0, total: 30, doneToday: false, finished: false, started: false });
  const st = programStatus({ done: { 1: '2026-09-24', 2: today } }, today);
  assert.equal(st.next, 3);
  assert.equal(st.doneToday, true);
});

test('badges are dated when first earned', () => {
  const log = [];
  for (let i = 0; i < 7; i++) log.push(s(addDays('2026-09-01', i), 700, i === 2 ? { before: 8, after: 4 } : {}));
  const b = earnedBadges({ sessions: log, tests: [], program: {} });
  assert.equal(b.first, '2026-09-01');
  assert.equal(b.streak3, '2026-09-03');
  assert.equal(b.streak7, '2026-09-07');
  assert.equal(b.calm, '2026-09-03');
  assert.equal(b.hour1, '2026-09-06');
  assert.ok(!b.streak14);
});

test('flexibility progress compares first and latest', () => {
  const tests = [
    { t: 1, day: '2026-09-01', results: { fold: 1, hips: 0 } },
    { t: 2, day: '2026-09-15', results: { fold: 2, hips: 0 } },
  ];
  const p = testProgress(tests);
  assert.equal(p.fold.change, 1);
  assert.equal(p.hips.change, 0);
  assert.equal(earnedBadges({ sessions: [], tests, program: {} }).looser, '2026-09-15');
});

test('stuck spots counts recent check-ins', () => {
  const r = stuckSpots([s(today, 600, { stuck: ['neck', 'hips'] }), s(today, 600, { stuck: ['neck'] })]);
  assert.equal(r.count, 2);
  assert.deepEqual(r.spots[0], { area: 'neck', times: 2 });
});
