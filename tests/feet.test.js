import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EXERCISES, EXERCISE, figureFor } from '../src/js/data/exercises.js';
import { ROUTINE } from '../src/js/data/routines.js';
import { PROGRAM } from '../src/js/data/program.js';
import { figureSVG } from '../src/js/figure/rig.js';
import { buildCustom } from '../src/js/lib/builder.js';

test('toe spreaders are only suggested in holds where your feet are free', () => {
  const friendly = EXERCISES.filter((ex) => ex.spreaders);
  assert.ok(friendly.length >= 6);
  for (const ex of friendly) {
    assert.equal(ex.kind, 'hold', ex.id);
    assert.ok(['back', 'seated'].includes(ex.position), `${ex.id} is ${ex.position}`);
  }
});

test('the figure wears toe spreaders only when you have them and the hold fits', () => {
  const wall = EXERCISE.legsupwall;
  assert.equal(figureFor(wall, false), wall.fig);
  assert.equal(figureFor(EXERCISE.child, true), EXERCISE.child.fig);
  const spec = figureFor(wall, true);
  assert.notEqual(spec, wall.fig);
  assert.equal(figureFor(wall, true), spec, 'the same spec object each time, so the player does not re-mount it');
  for (const mode of ['still', 'hold', 'preview']) {
    const svg = figureSVG(spec, { mode, t: 2.5 });
    assert.ok(!svg.includes('NaN'), mode);
    assert.ok(svg.includes('fg-spreader'), mode);
  }
  assert.ok(!figureSVG(wall.fig).includes('fg-spreader'));
});

test('feet have exercises on the mat and on a chair', () => {
  const feet = EXERCISES.filter((ex) => ex.areas.includes('feet'));
  assert.ok(feet.length >= 4);
  for (const place of ['mat', 'chair']) {
    const items = buildCustom({ minutes: 10, areas: ['feet'], place, seed: 5 });
    assert.ok(items.some((i) => EXERCISE[i.id].areas.includes('feet')), place);
  }
});

test('Happy Feet is in the plan', () => {
  assert.ok(ROUTINE.feet);
  assert.ok(ROUTINE.feet.items.some(([id]) => EXERCISE[id].spreaders), 'ends with a hold for the toe spreaders');
  assert.ok(PROGRAM.days.filter((d) => d.routine === 'feet').length >= 2);
});
