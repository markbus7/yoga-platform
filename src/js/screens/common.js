// Pieces shared by several screens.

import { html, raw, esc } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { figureThumb } from '../ui/figure-view.js';
import { EXERCISE } from '../data/exercises.js';
import { STYLE_NAME } from '../data/routines.js';
import { PROGRAM, weekOf } from '../data/program.js';
import { estimateSeconds, routineItems, scaledSeconds } from '../lib/session.js';

export function topBar(title, { action = '' } = {}) {
  return html`<div class="bar"><button class="icon-btn" data-act="back" aria-label="Back">${raw(icon('back'))}</button><span class="title">${title}</span>${raw(action)}</div>`;
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
      <span class="m"><span>${routineMinutes(app, r)} min</span><span>${STYLE_NAME[r.style]}</span>${raw(extra)}</span></span>
    <span class="thumb">${raw(figureThumb(ex.fig, { glow: false }))}</span>
  </button>`;
}

export const KIND_NAME = { flow: 'Moving', hold: 'Gravity hold', breath: 'Breathing' };

export function kindTag(ex) {
  return html`<span class="tag"><i class="kind-dot kind-${ex.kind}"></i>${KIND_NAME[ex.kind]}</span>`;
}

export function exTile(ex) {
  const t = ex.sides ? `${ex.sec}s each side` : ex.sec >= 60 ? `${Math.round((ex.sec / 60) * 10) / 10} min` : `${ex.sec}s`;
  return html`<button class="ex-tile" data-go="exercise:${ex.id}">
    <span class="thumb">${raw(figureThumb(ex.fig))}</span>
    <span class="n">${ex.name}</span>
    <span class="m">${kindTag(ex)}<span class="tag">${t}</span></span>
  </button>`;
}

export function itemTime(app, id, sec, scale) {
  const ex = EXERCISE[id];
  const s = scaledSeconds(ex, sec, scale ?? app.store.state.settings.hold);
  const txt = s >= 60 && s % 60 === 0 ? `${s / 60} min` : s > 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : `${s}s`;
  return ex.sides ? `${txt} each side` : txt;
}

export function programDayInfo(day) {
  const d = PROGRAM.days[day - 1];
  return d ? { ...d, weekInfo: weekOf(day) } : null;
}

export function emptyNote(text, button = '') {
  return html`<div class="empty"><span>${text}</span>${raw(button)}</div>`;
}

export { esc };
