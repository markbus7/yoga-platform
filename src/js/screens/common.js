// Pieces shared by several screens.

import { html, raw, esc } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { figureThumb } from '../ui/figure-view.js';
import { EXERCISE } from '../data/exercises.js';
import { ROUTINE, STYLE_NAME } from '../data/routines.js';
import { PROGRAM, weekOf } from '../data/program.js';
import { AREA_NAME } from '../data/areas.js';
import { estimateSeconds, routineItems, scaledSeconds } from '../lib/session.js';
import { t, inline } from '../i18n.js';

export function topBar(title, { action = '' } = {}) {
  return html`<div class="bar"><button class="icon-btn" data-act="back" aria-label="${t('common.back')}">${raw(icon('back'))}</button><span class="title">${title}</span>${raw(action)}</div>`;
}

/** The exercise that best represents a routine in a thumbnail. */
export function featured(routine) {
  if (routine.feature && EXERCISE[routine.feature]) return EXERCISE[routine.feature];
  let best = routine.items[0];
  for (const it of routine.items) {
    const ex = EXERCISE[it[0]];
    const bex = EXERCISE[best[0]];
    if (ex.kind === 'hold' && (bex.kind !== 'hold' || it[1] > best[1])) best = it;
  }
  return EXERCISE[best[0]];
}

export function holdScale(app, programDay) {
  const base = app.store.state.settings.hold;
  return programDay ? base * weekOf(programDay).hold : base;
}

export function routineMinutes(app, routine, programDay) {
  const sec = estimateSeconds(routineItems(routine), { scale: holdScale(app, programDay), transition: app.store.state.settings.transition });
  return Math.max(1, Math.round(sec / 60));
}

export function routineCard(app, r, extra = '') {
  const ex = featured(r);
  return html`<button class="routine-card on-color" data-color="${r.color}" data-go="routine:${r.id}">
    <span><span class="n">${r.name}</span><span class="d" style="display:block">${r.tagline}</span>
      <span class="m"><span>${t('common.min', { n: routineMinutes(app, r) })}</span><span>${STYLE_NAME[r.style]}</span>${raw(extra)}</span></span>
    <span class="thumb">${raw(figureThumb(ex.fig, { glow: false }))}</span>
  </button>`;
}

export function kindTag(ex) {
  return html`<span class="tag"><i class="kind-dot kind-${ex.kind}"></i>${t('kind.' + ex.kind)}</span>`;
}

function secondsText(s) {
  if (s >= 60 && s % 60 === 0) return t('common.min', { n: s / 60 });
  if (s > 60) return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  return `${s}s`;
}

export function exTile(ex) {
  const base = secondsText(ex.sec);
  return html`<button class="ex-tile" data-go="exercise:${ex.id}">
    <span class="thumb">${raw(figureThumb(ex.fig))}</span>
    <span class="n">${ex.name}</span>
    <span class="m">${kindTag(ex)}<span class="tag">${ex.sides ? t('time.eachSide', { t: base }) : base}</span></span>
  </button>`;
}

export function itemTime(app, id, sec, scale) {
  const ex = EXERCISE[id];
  const txt = secondsText(scaledSeconds(ex, sec, scale ?? app.store.state.settings.hold));
  return ex.sides ? t('time.eachSide', { t: txt }) : txt;
}

export function programDayInfo(day) {
  const d = PROGRAM.days[day - 1];
  return d ? { ...d, weekInfo: weekOf(day) } : null;
}

/** A saved session's title in the current language (older or video sessions keep their stored title). */
export function sessionTitle(s) {
  const r = s.routineId && ROUTINE[s.routineId];
  if (r) return s.programDay ? t('session.day', { day: s.programDay, name: r.name }) : r.name;
  if (s.source === 'single' && s.exId && EXERCISE[s.exId]) return EXERCISE[s.exId].name;
  if (s.source === 'custom' && Array.isArray(s.focus)) {
    return s.focus.length ? t('session.customFocus', { areas: s.focus.map((a) => inline(AREA_NAME[a])).join(t('list.and')) }) : t('session.custom');
  }
  return s.title || '';
}

const FEEL_IDS = ['calmer', 'looser', 'lighter', 'sleepy', 'energised', 'same', 'sore'];
/** Feelings are stored as ids; very early saves stored the English word. */
export function feelingName(f) {
  const id = String(f).toLowerCase();
  return FEEL_IDS.includes(id) ? t('feel.' + id) : f;
}

/** ' long' when a title has a word too wide for the big display size (Dutch compounds). */
export function longTitle(text) {
  return String(text).replace(/\u00ad/g, '').split(/\s+/).some((w) => w.length >= 12) ? ' long' : '';
}

export function emptyNote(text, button = '') {
  return html`<div class="empty"><span>${text}</span>${raw(button)}</div>`;
}

export { esc };
