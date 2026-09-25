// One routine: what's in it, how long it takes, and a start button.

import { html, raw, n } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { figureThumb } from '../ui/figure-view.js';
import { ROUTINE, STYLE_NAME } from '../data/routines.js';
import { EXERCISE } from '../data/exercises.js';
import { AREA_NAME } from '../data/areas.js';
import { HOLD_LENGTHS, areasOf, routineItems } from '../lib/session.js';
import { topBar, routineMinutes, itemTime, holdScale, programDayInfo } from './common.js';

export function render(app, route) {
  const r = ROUTINE[route.arg];
  if (!r) return html`${topBar('Not found')}<p>That routine does not exist.</p>`;
  const day = route.day ? +route.day : null;
  const info = day ? programDayInfo(day) : null;
  const scale = holdScale(app, day);
  const hold = app.store.state.settings.hold;
  const areas = areasOf(routineItems(r)).slice(0, 6);
  return html`
    ${topBar(day ? `Day ${day} of 30` : r.name)}
    <section class="band on-color" data-color="${r.color}">
      ${info ? html`<span class="eyebrow" style="color:inherit;opacity:.8">Day ${day} · Week ${info.week}: ${info.weekInfo.name}</span>` : ''}
      <h1 tabindex="-1">${r.name}</h1>
      <p style="font-size:17px;opacity:.92">${r.tagline}</p>
      <div class="meta"><span>${raw(icon('clock'))}${routineMinutes(app, r, day)} min</span><span>${raw(icon('layers'))}${STYLE_NAME[r.style]}</span><span>${n('exercise', r.items.length)}</span></div>
    </section>
    <section class="section">
      <p class="prose">${r.about}</p>
      ${info ? html`<p class="muted small">${info.weekInfo.about} Hold times this week: ${Math.round(info.weekInfo.hold * 100)}% of standard.</p>` : ''}
      <div class="field">
        <span class="label">Hold length</span>
        <div class="seg" role="group" aria-label="Hold length">${HOLD_LENGTHS.map((h) => html`<button data-act="hold" data-v="${h.id}" aria-pressed="${hold === h.id}">${h.name}</button>`)}</div>
      </div>
      <div class="row wrap" style="--gap:6px">${areas.map((a) => html`<span class="tag glow">${AREA_NAME[a]}</span>`)}</div>
    </section>
    <section class="section">
      <h2 class="section-title">What you'll do</h2>
      <div class="list seq">${r.items.map(([id, sec]) => {
        const ex = EXERCISE[id];
        return html`<button class="seq-row" data-go="exercise:${id}"><span class="thumb">${raw(figureThumb(ex.fig, { glow: false }))}</span><span><span class="t" style="display:block">${ex.name}</span><span class="d">${ex.summary}</span></span><span class="time">${itemTime(app, id, sec, scale)}</span></button>`;
      })}</div>
    </section>
    <div class="sticky-cta"><button class="btn btn-lg" data-act="start-routine" data-id="${r.id}" data-day="${day || ''}">${raw(icon('play'))} Start ${day ? `day ${day}` : r.name}</button></div>`;
}

export const actions = {
  hold(app, el) {
    const v = +el.dataset.v;
    app.store.update((s) => {
      s.settings.hold = v;
    });
  },
};
