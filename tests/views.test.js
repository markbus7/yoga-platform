import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EXERCISES, EXERCISE, figureFor, viewKinds } from '../src/js/data/exercises.js';
import { POSES, ALT_VIEWS } from '../src/js/figure/poses.js';
import { figureSVG, resolvePose } from '../src/js/figure/rig.js';
import { normalize } from '../src/js/lib/store.js';

test('extra camera angles belong to real figures and look from a different side', () => {
  for (const [id, specs] of Object.entries(ALT_VIEWS)) {
    assert.ok(POSES[id], `${id} is a figure`);
    const kinds = [POSES[id].view || 'side', ...specs.map((s) => s.view || 'side')];
    assert.equal(new Set(kinds).size, kinds.length, `${id} repeats a view: ${kinds}`);
    for (const k of kinds) assert.ok(['side', 'front', 'top'].includes(k), `${id}: ${k}`);
  }
});

test('every extra angle renders without NaN in every mode', () => {
  for (const [id, specs] of Object.entries(ALT_VIEWS)) {
    for (const spec of specs) {
      for (const mode of ['still', 'preview', 'hold', 'enter']) {
        for (const t of [0, 1.3, 4.7]) {
          const svg = figureSVG(spec, { mode, t });
          assert.ok(!/NaN|Infinity/.test(svg), `${id} ${spec.view} ${mode} ${t}`);
        }
      }
    }
  }
});

test('extra angles move the same way as the main figure (no limb spins round)', () => {
  const ANG = /^(lumbar|thorax|neck|head|thigh|shin|foot|uarm|farm|pelvis)/;
  for (const [id, specs] of Object.entries(ALT_VIEWS)) {
    for (const spec of specs) {
      assert.equal(spec.frames.length, POSES[id].frames.length, `${id} ${spec.view}: same number of frames`);
      const view = spec.view === 'top' ? 'front' : spec.view || 'side';
      const fr = spec.frames.map((f) => resolvePose({ ...f, view }));
      for (let i = 0; i + 1 < fr.length; i++) {
        for (const k of Object.keys(fr[i + 1])) {
          if (!ANG.test(k) || typeof fr[i][k] !== 'number') continue;
          assert.ok(Math.abs(fr[i + 1][k] - fr[i][k]) <= 180, `${id} ${spec.view} ${k}`);
        }
      }
    }
  }
});

test('exercises list their views, main one first, and toe spreaders show in every view', () => {
  const multi = EXERCISES.filter((ex) => ex.views.length > 1);
  assert.ok(multi.length >= 6);
  assert.ok(EXERCISE.child.views.length > 1, "child's pose can be seen from above");
  assert.deepEqual(viewKinds(EXERCISE.child), ['side', 'top']);
  for (const ex of EXERCISES) {
    assert.equal(ex.views[0], ex.fig, ex.id);
    assert.equal(figureFor(ex, false, 99), ex.fig, 'unknown view falls back to the main one');
  }
  const withSpreaders = multi.find((ex) => ex.spreaders);
  if (withSpreaders) {
    const spec = figureFor(withSpreaders, true, 1);
    assert.ok(spec.props.some((p) => p.t === 'spreaders'));
    assert.equal(figureFor(withSpreaders, true, 1), spec, 'cached');
  }
});

test('background sound settings are kept in range', () => {
  const s = normalize({}).settings;
  assert.equal(s.ambient, 'waves');
  assert.equal(s.ambientVol, 0.5);
  assert.equal(normalize({ settings: { ambient: 'disco', ambientVol: 7 } }).settings.ambient, 'waves');
  assert.equal(normalize({ settings: { ambientVol: 7 } }).settings.ambientVol, 1);
  assert.equal(normalize({ settings: { ambientVol: 'x' } }).settings.ambientVol, 0.5);
  assert.equal(normalize({ settings: { ambient: 'off' } }).settings.ambient, 'off');
});

test('an animation asked for a moment before it started shows its first frame', async () => {
  const { prepareFigure, poseAt } = await import('../src/js/figure/rig.js');
  for (const id of ['child', 'squat', 'pigeon']) {
    const fig = prepareFigure(POSES[id]);
    for (const mode of ['enter', 'preview', 'hold']) assert.ok(poseAt(fig, -0.04, mode, 3), `${id} ${mode}`);
  }
});
