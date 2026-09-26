import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EXERCISES, EXERCISE } from '../src/js/data/exercises.js';
import { ROUTINES } from '../src/js/data/routines.js';
import { PROGRAM } from '../src/js/data/program.js';
import { AREAS } from '../src/js/data/areas.js';
import { TESTS } from '../src/js/data/tests.js';
import { POSES } from '../src/js/figure/poses.js';
import { VIDEOS } from '../src/js/data/videos.js';
import { figureSVG } from '../src/js/figure/rig.js';
import { estimateSeconds, routineItems } from '../src/js/lib/session.js';

const areaIds = new Set(AREAS.map((a) => a.id));

test('exercise ids are unique', () => {
  assert.equal(new Set(EXERCISES.map((e) => e.id)).size, EXERCISES.length);
});

test('every exercise is complete', () => {
  for (const ex of EXERCISES) {
    assert.ok(ex.name && ex.summary && ex.feel, ex.id);
    assert.ok(['flow', 'hold', 'breath'].includes(ex.kind), ex.id);
    assert.ok(ex.sec >= 20, ex.id);
    assert.ok(ex.setup.length >= 2, ex.id + ' setup');
    assert.ok(ex.cues.length >= 2, ex.id + ' cues');
    assert.ok(ex.say, ex.id + ' say');
    assert.ok(ex.fig && ex.fig.frames.length, ex.id + ' figure');
    for (const a of ex.areas) assert.ok(areaIds.has(a), `${ex.id}: unknown area ${a}`);
    if (ex.kind === 'breath') assert.ok(ex.breath && ex.breath.length >= 2, ex.id + ' breath pattern');
    else assert.ok(ex.areas.length, ex.id + ' areas');
    if (ex.sides) assert.equal(ex.sideLabels.length, 2, ex.id);
  }
});

test('every figure renders without NaN in every mode', () => {
  for (const [id, spec] of Object.entries(POSES)) {
    for (const mode of ['still', 'preview', 'hold', 'enter']) {
      for (const t of [0, 1.3, 4.7]) {
        const svg = figureSVG(spec, { mode, t });
        assert.ok(!svg.includes('NaN'), `${id} ${mode} ${t}`);
        assert.ok(!svg.includes('Infinity'), `${id} ${mode} ${t}`);
      }
    }
  }
});

test('routines reference real exercises and have sensible lengths', () => {
  for (const r of ROUTINES) {
    for (const [id] of r.items) assert.ok(EXERCISE[id], `${r.id}: missing ${id}`);
    const min = estimateSeconds(routineItems(r)) / 60;
    assert.ok(min >= 2 && min <= 35, `${r.id} is ${min.toFixed(1)} min`);
  }
});

test('the 30-day plan uses real routines and flexibility checks on days 1, 15 and 30', () => {
  assert.equal(PROGRAM.days.length, 30);
  const ids = new Set(ROUTINES.map((r) => r.id));
  for (const d of PROGRAM.days) {
    assert.ok(ids.has(d.routine), `day ${d.day}: ${d.routine}`);
    assert.equal(d.tip.length, 2);
  }
  assert.deepEqual(PROGRAM.days.filter((d) => d.check).map((d) => d.day), [1, 15, 30]);
});

test('flexibility tests point at real figures', () => {
  for (const t of TESTS) {
    assert.ok(POSES[t.fig], t.id);
    assert.ok(t.levels.length >= 4, t.id);
  }
});

test('videos are YouTube watch links', () => {
  for (const v of VIDEOS) assert.match(v.url, /^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}$/, v.id);
});
