import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fitsNow, planForNow, alternatives, FOR_NOW } from '../src/js/lib/suggest.js';
import { ROUTINE } from '../src/js/data/routines.js';
import { PROGRAM } from '../src/js/data/program.js';
import { partOfDay } from '../src/js/lib/dates.js';

const at = (h, m = 0) => partOfDay(new Date(2026, 8, 27, h, m));

test('the day is split at sensible times', () => {
  assert.equal(at(4, 59), 'night');
  assert.equal(at(5), 'morning');
  assert.equal(at(11, 59), 'morning');
  assert.equal(at(12), 'afternoon');
  assert.equal(at(17), 'evening');
  assert.equal(at(21, 59), 'evening');
  assert.equal(at(22), 'night');
  assert.equal(at(23, 35), 'night');
});

test('a wake-up plan day late at night becomes a wind-down that still counts', () => {
  const wake = ROUTINE.wakeup;
  assert.equal(planForNow(wake.id, wake.when, 'night'), 'winddown');
  assert.equal(planForNow(wake.id, wake.when, 'evening'), 'gravitybasics');
  assert.equal(planForNow(wake.id, wake.when, 'morning'), 'wakeup');
  const bed = ROUTINE.winddown;
  assert.equal(planForNow(bed.id, bed.when, 'morning'), 'wakeup');
  assert.equal(planForNow(bed.id, bed.when, 'night'), 'winddown');
  assert.equal(planForNow('neck', 'any', 'night'), 'neck', 'routines for any time stay');
});

test('every plan day has something that suits each part of the day', () => {
  for (const d of PROGRAM.days) {
    const r = ROUTINE[d.routine];
    for (const part of ['morning', 'afternoon', 'evening', 'night']) {
      const id = planForNow(r.id, r.when, part);
      assert.ok(ROUTINE[id] && fitsNow(ROUTINE[id].when, part), `day ${d.day} ${part}: ${id}`);
    }
  }
  for (const [part, id] of Object.entries(FOR_NOW)) assert.ok(fitsNow(ROUTINE[id].when, part), part);
});

test('the options under the main card always offer a way to wake up and to wind down', () => {
  const night = alternatives('winddown', 'night', 'wakeup');
  assert.deepEqual(night.map((a) => a.id), ['wakeup', 'breathe', 'gravity']);
  assert.equal(night[0].plan, true, 'the swapped-out plan routine is offered first and counts');
  const morning = alternatives('wakeup', 'morning');
  assert.deepEqual(morning.map((a) => a.id), ['winddown', 'breathe', 'desk']);
  for (const part of ['morning', 'afternoon', 'evening', 'night']) {
    const list = alternatives(FOR_NOW[part], part);
    assert.equal(list.length, 3);
    assert.ok(!list.some((a) => a.id === FOR_NOW[part]));
    for (const a of list) assert.ok(ROUTINE[a.id], a.id);
  }
});
