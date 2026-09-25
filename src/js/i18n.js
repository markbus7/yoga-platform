// Language switching. English is the source; Dutch overlays the interface
// text (locales/nl.js) and the content (exercise, routine, plan, guide and
// test text is swapped in place, so screens keep reading the same objects).

import { EN } from './locales/en.js';
import { NL } from './locales/nl.js';
import { EXERCISES_NL } from './locales/nl-exercises.js';
import { ROUTINES_NL, STYLES_NL, PROGRAM_NL, GUIDE_NL, TESTS_NL, VIDEOS_NL, LEARN_NL, AREAS_NL, CARE_NL, POSITIONS_NL, BADGES_NL, HOLDS_NL } from './locales/nl-content.js';
import { EXERCISES } from './data/exercises.js';
import { ROUTINES, STYLE_NAME } from './data/routines.js';
import { PROGRAM } from './data/program.js';
import { GUIDE } from './data/guide.js';
import { TESTS } from './data/tests.js';
import { VIDEOS, LEARN_LINKS } from './data/videos.js';
import { AREAS, AREA_NAME, CARE_AREAS, POSITIONS } from './data/areas.js';
import { BADGES } from './lib/stats.js';
import { HOLD_LENGTHS } from './lib/session.js';
import { setDateLocale } from './lib/dates.js';

export const LANGS = ['en', 'nl'];
const DICTS = { en: EN, nl: NL };
let current = 'en';

export const lang = () => current;

/** The browser's preferred language when the person has not chosen one. */
export function detectLang() {
  try {
    const prefs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
    return prefs.some((l) => /^nl\b/i.test(l || '')) ? 'nl' : 'en';
  } catch {
    return 'en';
  }
}

/** Interface text. Plural entries pick `one` or `other` from vars.n. */
export function t(key, vars = {}) {
  let s = DICTS[current][key] ?? EN[key];
  if (s == null) return key;
  if (typeof s === 'object') s = vars.n === 1 ? s.one : s.other;
  return s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? String(vars[k]) : m));
}

/** A number written the local way (2.4 or 2,4). */
export function num(x, digits = 1) {
  const f = 10 ** digits;
  return (Math.round(x * f) / f).toLocaleString(current === 'nl' ? 'nl-NL' : 'en-GB');
}

/** A name used inside a sentence: Dutch writes "sessie nek & schouders", English keeps "Neck & Shoulders". */
export function inline(name) {
  return current === 'nl' ? name.charAt(0).toLowerCase() + name.slice(1) : name;
}

/** "neck, hips and chest" style list. */
export function list(items) {
  if (items.length < 2) return items.join('');
  const and = current === 'nl' ? ' en ' : ' and ';
  return items.slice(0, -1).join(', ') + and + items[items.length - 1];
}

// ---------- content ----------

const originals = new Map();
const keep = (obj, fields) => {
  if (!originals.has(obj)) {
    const snap = {};
    for (const f of fields) snap[f] = obj[f];
    originals.set(obj, snap);
  }
  return originals.get(obj);
};
const swap = (obj, fields, tr) => {
  const base = keep(obj, fields);
  for (const f of fields) obj[f] = tr && tr[f] != null ? tr[f] : base[f];
};

let guideEN = null;
const EX_FIELDS = ['name', 'summary', 'feel', 'setup', 'cues', 'say', 'easier', 'deeper', 'careful', 'exit', 'sideLabels'];

function applyContent(l) {
  const nl = l === 'nl';
  for (const ex of EXERCISES) {
    const tr = nl ? EXERCISES_NL[ex.id] : null;
    swap(ex, EX_FIELDS, tr);
    if (ex.breath) ex.breath.forEach((b, i) => swap(b, ['label'], tr && tr.breath ? { label: tr.breath[i] } : null));
  }
  for (const r of ROUTINES) swap(r, ['name', 'tagline', 'about'], nl ? ROUTINES_NL[r.id] : null);
  swap(STYLE_NAME, Object.keys(STYLES_NL), nl ? STYLES_NL : null);
  swap(PROGRAM, ['about'], nl ? PROGRAM_NL : null);
  PROGRAM.weeks.forEach((w, i) => swap(w, ['name', 'about'], nl ? PROGRAM_NL.weeks[i] : null));
  PROGRAM.days.forEach((d, i) => swap(d, ['tip'], nl ? { tip: PROGRAM_NL.tips[i] } : null));
  if (!guideEN) guideEN = [...GUIDE];
  GUIDE.splice(0, GUIDE.length, ...(nl ? GUIDE_NL : guideEN));
  for (const test of TESTS) swap(test, ['name', 'how', 'levels'], nl ? TESTS_NL[test.id] : null);
  for (const v of VIDEOS) swap(v, ['focus', 'why'], nl ? VIDEOS_NL[v.id] : null);
  LEARN_LINKS.forEach((x, i) => swap(x, ['title'], nl ? LEARN_NL[i] : null));
  for (const a of AREAS) {
    swap(a, ['name'], nl ? { name: AREAS_NL[a.id] } : null);
    AREA_NAME[a.id] = a.name;
  }
  for (const c of CARE_AREAS) swap(c, ['name'], nl ? { name: CARE_NL[c.id] } : null);
  swap(POSITIONS, Object.keys(POSITIONS_NL), nl ? POSITIONS_NL : null);
  for (const b of BADGES) swap(b, ['name', 'desc'], nl ? BADGES_NL[b.id] : null);
  HOLD_LENGTHS.forEach((h, i) => swap(h, ['name', 'about'], nl ? HOLDS_NL[i] : null));
}

export function setLang(l) {
  current = DICTS[l] ? l : 'en';
  applyContent(current);
  setDateLocale(current);
  if (typeof document !== 'undefined') document.documentElement.lang = current;
}
