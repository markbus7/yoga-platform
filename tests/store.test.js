import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, mergeStates, defaultState } from '../src/js/lib/store.js';

test('normalize fills in missing fields and drops broken entries', () => {
  const s = normalize({ profile: { name: 'Sam' }, sessions: [{ id: 'a', day: '2026-09-01' }, { nope: 1 }] });
  assert.equal(s.profile.name, 'Sam');
  assert.equal(s.profile.blocks, 4);
  assert.equal(s.settings.voice, true);
  assert.equal(s.sessions.length, 1);
  assert.deepEqual(s.program.done, {});
});

test('merging keeps every session from both copies and respects deletions', () => {
  const a = { ...defaultState(), sessions: [{ id: '1', t: 1, day: '2026-09-01' }, { id: '2', t: 2, day: '2026-09-02' }], removed: ['3'], updatedAt: 5 };
  const b = { ...defaultState(), sessions: [{ id: '2', t: 2, day: '2026-09-02' }, { id: '3', t: 3, day: '2026-09-03' }, { id: '4', t: 4, day: '2026-09-04' }], updatedAt: 9 };
  const m = mergeStates(a, b);
  assert.deepEqual(m.sessions.map((s) => s.id), ['1', '2', '4']);
  assert.deepEqual(m.removed, ['3']);
  assert.equal(m.updatedAt, 9);
});

test('merging takes settings from the newer copy and never loses a finished plan day', () => {
  const a = { ...defaultState(), settings: { ...defaultState().settings, hold: 1.35 }, program: { startedAt: null, done: { 1: '2026-09-01', 2: '2026-09-02' } }, updatedAt: 20 };
  const b = { ...defaultState(), settings: { ...defaultState().settings, hold: 0.75 }, program: { startedAt: null, done: { 1: '2026-09-01', 3: '2026-09-03' } }, updatedAt: 10 };
  const m = mergeStates(a, b);
  assert.equal(m.settings.hold, 1.35);
  assert.deepEqual(Object.keys(m.program.done).sort(), ['1', '2', '3']);
});
