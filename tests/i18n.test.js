import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EN } from '../src/js/locales/en.js';
import { NL } from '../src/js/locales/nl.js';
import { EXERCISES_NL } from '../src/js/locales/nl-exercises.js';
import { ROUTINES_NL, STYLES_NL, PROGRAM_NL, GUIDE_NL, TESTS_NL, VIDEOS_NL, LEARN_NL, AREAS_NL, CARE_NL, POSITIONS_NL, BADGES_NL, HOLDS_NL } from '../src/js/locales/nl-content.js';
import { t, num, list, setLang, lang } from '../src/js/i18n.js';
import { EXERCISES, EXERCISE } from '../src/js/data/exercises.js';
import { ROUTINES, ROUTINE, STYLE_NAME } from '../src/js/data/routines.js';
import { PROGRAM } from '../src/js/data/program.js';
import { GUIDE } from '../src/js/data/guide.js';
import { TESTS } from '../src/js/data/tests.js';
import { VIDEOS, LEARN_LINKS } from '../src/js/data/videos.js';
import { AREAS, AREA_NAME, CARE_AREAS, POSITIONS } from '../src/js/data/areas.js';
import { BADGES } from '../src/js/lib/stats.js';
import { HOLD_LENGTHS } from '../src/js/lib/session.js';
import { weekdayShort, fmtDay } from '../src/js/lib/dates.js';

const placeholders = (s) => (s.match(/\{\w+\}/g) || []).sort().join(',');
const filled = (v) => typeof v === 'string' && v.trim().length > 0;

test('Dutch has exactly the English interface keys, with the same placeholders', () => {
  assert.deepEqual(Object.keys(NL).sort(), Object.keys(EN).sort());
  for (const key of Object.keys(EN)) {
    const en = EN[key];
    const nl = NL[key];
    if (typeof en === 'object') {
      assert.equal(typeof nl, 'object', key);
      for (const form of ['one', 'other']) {
        assert.ok(filled(nl[form]), `${key}.${form}`);
        assert.equal(placeholders(nl[form]), placeholders(en[form]), `${key}.${form}`);
      }
    } else {
      assert.ok(filled(nl), key);
      assert.equal(placeholders(nl), placeholders(en), key);
    }
  }
});

test('every exercise has Dutch text for each translated field', () => {
  for (const ex of EXERCISES) {
    const nl = EXERCISES_NL[ex.id];
    assert.ok(nl, `${ex.id}: missing`);
    for (const f of ['name', 'summary', 'feel', 'say', 'easier', 'deeper', 'careful']) assert.ok(filled(nl[f]), `${ex.id}.${f}`);
    for (const f of ['setup', 'cues']) {
      assert.ok(Array.isArray(nl[f]) && nl[f].length >= 2 && nl[f].every(filled), `${ex.id}.${f}`);
    }
    if (ex.exit) assert.ok(filled(nl.exit), `${ex.id}.exit`);
    if (ex.sides) assert.ok(Array.isArray(nl.sideLabels) && nl.sideLabels.length === 2 && nl.sideLabels.every(filled), `${ex.id}.sideLabels`);
    if (ex.breath) assert.ok(Array.isArray(nl.breath) && nl.breath.length === ex.breath.length && nl.breath.every(filled), `${ex.id}.breath`);
  }
  assert.deepEqual(Object.keys(EXERCISES_NL).sort(), EXERCISES.map((e) => e.id).sort());
});

test('routines, plan, guide, checks, videos, areas and milestones are all translated', () => {
  for (const r of ROUTINES) {
    const nl = ROUTINES_NL[r.id];
    assert.ok(nl && filled(nl.name) && filled(nl.tagline) && filled(nl.about), `routine ${r.id}`);
  }
  assert.deepEqual(Object.keys(STYLES_NL).sort(), Object.keys(STYLE_NAME).sort());
  assert.ok(filled(PROGRAM_NL.about));
  assert.equal(PROGRAM_NL.weeks.length, PROGRAM.weeks.length);
  for (const w of PROGRAM_NL.weeks) assert.ok(filled(w.name) && filled(w.about));
  assert.equal(PROGRAM_NL.tips.length, PROGRAM.days.length);
  for (const [i, tip] of PROGRAM_NL.tips.entries()) assert.ok(tip.length === 2 && tip.every(filled), `tip for day ${i + 1}`);
  assert.deepEqual(GUIDE_NL.map((g) => g.id), GUIDE.map((g) => g.id));
  for (const g of GUIDE_NL) {
    const en = GUIDE.find((x) => x.id === g.id);
    assert.ok(filled(g.title), `guide ${g.id}`);
    assert.equal((g.body || []).length, (en.body || []).length, `guide ${g.id} body`);
    assert.equal((g.list || []).length, (en.list || []).length, `guide ${g.id} list`);
    assert.equal(!!g.after, !!en.after, `guide ${g.id} after`);
  }
  for (const test of TESTS) {
    const nl = TESTS_NL[test.id];
    assert.ok(nl && filled(nl.name) && filled(nl.how), `check ${test.id}`);
    assert.equal(nl.levels.length, test.levels.length, `check ${test.id} levels`);
  }
  for (const v of VIDEOS) assert.ok(VIDEOS_NL[v.id] && filled(VIDEOS_NL[v.id].focus) && filled(VIDEOS_NL[v.id].why), `video ${v.id}`);
  assert.equal(LEARN_NL.length, LEARN_LINKS.length);
  for (const a of AREAS) assert.ok(filled(AREAS_NL[a.id]), `area ${a.id}`);
  for (const c of CARE_AREAS) assert.ok(filled(CARE_NL[c.id]), `care ${c.id}`);
  assert.deepEqual(Object.keys(POSITIONS_NL).sort(), Object.keys(POSITIONS).sort());
  for (const b of BADGES) assert.ok(BADGES_NL[b.id] && filled(BADGES_NL[b.id].name) && filled(BADGES_NL[b.id].desc), `badge ${b.id}`);
  assert.equal(HOLDS_NL.length, HOLD_LENGTHS.length);
});

test('there are classes in Dutch as well as English', () => {
  assert.ok(VIDEOS.filter((v) => v.lang === 'nl').length >= 5);
  assert.ok(VIDEOS.every((v) => v.lang === 'en' || v.lang === 'nl'));
});

test('t() fills placeholders and picks plural forms', () => {
  setLang('en');
  assert.equal(t('count.days', { n: 1 }), '1 day');
  assert.equal(t('count.days', { n: 3 }), '3 days');
  assert.equal(t('session.day', { day: 4, name: 'Gravity' }), 'Day 4: Gravity');
  assert.equal(t('greet.name', { greeting: 'Hi' }), 'Hi, {name}.', 'a missing value stays visible');
  assert.equal(t('no.such.key'), 'no.such.key');
  setLang('nl');
  assert.equal(lang(), 'nl');
  assert.equal(t('count.days', { n: 1 }), '1 dag');
  assert.equal(t('count.days', { n: 3 }), '3 dagen');
  assert.equal(t('tab.today'), 'Vandaag');
  assert.equal(num(2.46), '2,5');
  assert.equal(list(['nek', 'heupen', 'borst']), 'nek, heupen en borst');
  setLang('xx');
  assert.equal(lang(), 'en', 'unknown languages fall back to English');
  assert.equal(num(2.46), '2.5');
  assert.equal(list(['neck', 'hips']), 'neck and hips');
});

test('switching to Dutch and back restores the English content exactly', () => {
  setLang('en');
  const snapshot = () =>
    JSON.stringify({
      ex: EXERCISES.map(({ id, name, summary, feel, setup, cues, say, easier, deeper, careful, exit, sideLabels, breath }) => ({ id, name, summary, feel, setup, cues, say, easier, deeper, careful, exit, sideLabels, breath: breath && breath.map((b) => b.label) })),
      routines: ROUTINES.map(({ name, tagline, about }) => ({ name, tagline, about })),
      styles: { ...STYLE_NAME },
      program: { about: PROGRAM.about, weeks: PROGRAM.weeks.map(({ name, about }) => ({ name, about })), tips: PROGRAM.days.map((d) => d.tip) },
      guide: GUIDE.map((g) => g.title),
      tests: TESTS.map(({ name, how, levels }) => ({ name, how, levels })),
      videos: VIDEOS.map(({ focus, why }) => ({ focus, why })),
      areas: { ...AREA_NAME },
      care: CARE_AREAS.map((c) => c.name),
      positions: { ...POSITIONS },
      badges: BADGES.map(({ name, desc }) => ({ name, desc })),
      holds: HOLD_LENGTHS.map(({ name, about }) => ({ name, about })),
    });
  const english = snapshot();
  setLang('nl');
  assert.equal(EXERCISE.child.name, EXERCISES_NL.child.name);
  assert.equal(ROUTINE.gravity.name, ROUTINES_NL.gravity.name);
  assert.equal(AREA_NAME.neck, AREAS_NL.neck);
  assert.equal(GUIDE[0].title, GUIDE_NL[0].title);
  assert.equal(weekdayShort('2026-09-21'), 'ma');
  assert.equal(fmtDay('2026-03-05'), '5 mrt');
  assert.notEqual(snapshot(), english);
  setLang('en');
  assert.equal(snapshot(), english);
  assert.equal(weekdayShort('2026-09-21'), 'Mon');
  assert.equal(fmtDay('2026-03-05'), '5 Mar');
});
