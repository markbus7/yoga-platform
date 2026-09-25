import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTimeline, scaledSeconds, timelineSeconds, estimateSeconds } from '../src/js/lib/session.js';
import { buildCustom } from '../src/js/lib/builder.js';
import { EXERCISE } from '../src/js/data/exercises.js';

test('two-sided exercises get both sides and a switch', () => {
  const steps = buildTimeline([{ id: 'twist', sec: 60 }]);
  assert.deepEqual(steps.map((s) => s.type), ['move', 'pose', 'switch', 'pose']);
  assert.deepEqual(steps.filter((s) => s.type === 'pose').map((s) => s.side), [0, 1]);
});

test('hold scaling stretches holds more than flows and leaves breathing alone', () => {
  assert.equal(scaledSeconds(EXERCISE.child, 60, 1.5), 90);
  assert.equal(scaledSeconds(EXERCISE.catcow, 60, 1.5), 70);
  assert.equal(scaledSeconds(EXERCISE.longexhale, 120, 1.5), 120);
});

test('changing position gives a longer transition', () => {
  const steps = buildTimeline([{ id: 'ragdoll' }, { id: 'calf' }, { id: 'child' }], { transition: 8 });
  const moves = steps.filter((s) => s.type === 'move').map((s) => s.sec);
  assert.deepEqual(moves, [7, 8, 11]);
  assert.equal(timelineSeconds(steps), estimateSeconds([{ id: 'ragdoll' }, { id: 'calf' }, { id: 'child' }], { transition: 8 }));
});

test('built sessions fit the time budget', () => {
  for (const minutes of [5, 10, 15, 20]) {
    for (const style of ['mix', 'moving', 'gravity']) {
      const items = buildCustom({ minutes, style, areas: ['hips', 'lowerBack'], seed: 7 });
      const sec = estimateSeconds(items);
      assert.ok(items.length >= 2, `${minutes} ${style}`);
      assert.ok(sec <= minutes * 60 * 1.1, `${minutes} ${style}: ${sec}`);
      assert.ok(sec >= minutes * 60 * 0.6, `${minutes} ${style}: ${sec} too short`);
    }
  }
});

test('built sessions cover every chosen area', () => {
  const areas = ['neck', 'hamstrings', 'chest'];
  const items = buildCustom({ minutes: 15, areas, seed: 3 });
  for (const a of areas) assert.ok(items.some((i) => EXERCISE[i.id].areas.includes(a)), a);
});

test('care areas and place are respected', () => {
  const items = buildCustom({ minutes: 15, care: ['knees'], seed: 11 });
  assert.ok(items.every((i) => !EXERCISE[i.id].care.includes('knees')));
  const chair = buildCustom({ minutes: 5, place: 'chair', seed: 2 });
  assert.ok(chair.every((i) => ['chair', 'standing'].includes(EXERCISE[i.id].position)));
});

test('the same seed gives the same session', () => {
  assert.deepEqual(buildCustom({ minutes: 10, seed: 42 }), buildCustom({ minutes: 10, seed: 42 }));
});
