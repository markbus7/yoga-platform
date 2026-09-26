import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EXERCISES, EXERCISE } from '../src/js/data/exercises.js';
import { ROUTINE } from '../src/js/data/routines.js';
import { figureSVG } from '../src/js/figure/rig.js';
import { buildCustom } from '../src/js/lib/builder.js';
import { normalize } from '../src/js/lib/store.js';

const matOnly = EXERCISES.filter((ex) => ex.gear === 'shakti').map((ex) => ex.id);

test('acupressure mat exercises are drawn on the mat', () => {
  assert.deepEqual(matOnly.sort(), ['shaktirest', 'shaktistand']);
  for (const id of matOnly) {
    const svg = figureSVG(EXERCISE[id].fig);
    assert.ok(svg.includes('fg-shakti') && svg.includes('fg-spikes'), id);
    assert.ok(!svg.includes('NaN'), id);
  }
});

test('built sessions only use the acupressure mat when you have one', () => {
  for (let seed = 1; seed <= 12; seed++) {
    const without = buildCustom({ minutes: 20, style: 'gravity', areas: ['upperBack', 'feet'], seed });
    assert.ok(without.every((i) => !matOnly.includes(i.id)), `seed ${seed}`);
  }
  const withMat = Array.from({ length: 12 }, (_, i) => buildCustom({ minutes: 20, style: 'gravity', areas: ['upperBack', 'lowerBack'], seed: i + 1, have: { shakti: true } }));
  assert.ok(withMat.some((items) => items.some((i) => matOnly.includes(i.id))), 'the mat shows up for someone who has it');
});

test('the Acupressure Rest routine needs the mat, and older saves get the gear defaults', () => {
  assert.equal(ROUTINE.shakti.gear, 'shakti');
  assert.ok(ROUTINE.shakti.items.some(([id]) => id === 'shaktirest'));
  const old = normalize({ profile: { name: 'Mark', goal: 10 } });
  assert.equal(old.profile.shakti, true);
  assert.equal(old.profile.spreaders, true);
  assert.equal(old.profile.name, 'Mark');
});
