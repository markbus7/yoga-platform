// Explore: routines, the exercise library and video classes.

import { html, raw, esc, sheet, toast } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { ROUTINES } from '../data/routines.js';
import { EXERCISES } from '../data/exercises.js';
import { AREAS } from '../data/areas.js';
import { VIDEOS } from '../data/videos.js';
import { dayKey } from '../lib/dates.js';
import { newId } from '../lib/store.js';
import { routineCard, exTile } from './common.js';

const TABS = [
  ['routines', 'Routines'],
  ['exercises', 'Exercises'],
  ['videos', 'Videos'],
];
const KINDS = [
  ['all', 'All types'],
  ['flow', 'Moving'],
  ['hold', 'Gravity holds'],
  ['breath', 'Breathing'],
];
const WHEN = { morning: 'Morning', evening: 'Evening', night: 'Bedtime', day: 'Workday', weekend: 'Weekend', any: 'Any time' };

function routinesTab(app) {
  return html`<div class="routine-list">${ROUTINES.map((r) => routineCard(app, r, `<span>${WHEN[r.when]}</span>`))}</div>`;
}

function exercisesTab(app) {
  const f = app.ui.explore;
  const list = EXERCISES.filter((ex) => (f.area === 'all' || ex.areas.includes(f.area)) && (f.kind === 'all' || ex.kind === f.kind));
  return html`
    <div class="stack">
      <div class="chips scroll" role="group" aria-label="Body area">
        <button class="chip" data-act="area" data-v="all" aria-pressed="${f.area === 'all'}">Whole body</button>
        ${AREAS.map((a) => html`<button class="chip" data-act="area" data-v="${a.id}" aria-pressed="${f.area === a.id}">${a.name}</button>`)}
      </div>
      <div class="chips" role="group" aria-label="Type">${KINDS.map(([k, label]) => html`<button class="chip" data-act="kind" data-v="${k}" aria-pressed="${f.kind === k}">${label}</button>`)}</div>
      <p class="muted small">${list.length} ${list.length === 1 ? 'exercise' : 'exercises'}. Tap one to see how it's done.</p>
      <div class="ex-grid">${list.map(exTile)}</div>
    </div>`;
}

function videosTab() {
  return html`
    <p class="lede">Free follow-along classes from teachers who are good with beginners. They open on YouTube. When you finish one, log it here so it counts toward your progress.</p>
    <div class="video-list">${VIDEOS.map(
      (v) => html`<article class="video-card">
        <span class="row wrap" style="--gap:6px"><span class="tag">${raw(icon('video'))}${v.focus}</span>${v.minutes ? html`<span class="tag">${v.minutes} min</span>` : ''}</span>
        <h3 class="t">${v.title}</h3>
        <p class="who">${v.teacher}</p>
        <p class="why">${v.why}</p>
        <div class="row wrap"><a class="btn btn-small" href="${v.url}" target="_blank" rel="noopener noreferrer">Watch on YouTube ${raw(icon('external'))}</a><button class="btn btn-small btn-ghost" data-act="log-video" data-id="${v.id}">${raw(icon('check'))} I did this</button></div>
      </article>`,
    )}</div>`;
}

export function render(app) {
  const tab = app.ui.explore.tab;
  const body = tab === 'routines' ? routinesTab(app) : tab === 'exercises' ? exercisesTab(app) : videosTab();
  return html`
    <header class="stack" style="--gap:14px">
      <h1 class="display" tabindex="-1">Explore</h1>
      <div class="seg" role="group" aria-label="Show">${TABS.map(([id, label]) => html`<button data-act="tab" data-v="${id}" aria-pressed="${tab === id}">${label}</button>`)}</div>
    </header>
    <div class="section" style="margin-top:18px">${body}</div>`;
}

export const actions = {
  tab(app, el) {
    app.ui.explore.tab = el.dataset.v;
    app.render();
  },
  area(app, el) {
    app.ui.explore.area = el.dataset.v;
    app.render({ keepScroll: true });
  },
  kind(app, el) {
    app.ui.explore.kind = el.dataset.v;
    app.render({ keepScroll: true });
  },
  async 'log-video'(app, el) {
    const v = VIDEOS.find((x) => x.id === el.dataset.id);
    if (!v) return;
    const minutes = await sheet(
      () => `<h2>Log “${esc(v.title)}”</h2>
        <div class="field"><label for="lv-min">How many minutes did you do?</label>
        <input id="lv-min" class="input" type="number" inputmode="numeric" min="1" max="180" value="${v.minutes || 15}"></div>
        <div class="row wrap"><button class="btn" data-a="ok">${icon('check')} Save</button><button class="btn btn-ghost" data-a="no">Cancel</button></div>`,
      (box, close) => {
        const input = box.querySelector('#lv-min');
        box.querySelector('[data-a="ok"]').onclick = () => close(Math.max(1, Math.min(180, Math.round(+input.value || 0))));
        box.querySelector('[data-a="no"]').onclick = () => close(null);
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') close(Math.max(1, Math.min(180, Math.round(+input.value || 0))));
        });
      },
    );
    if (!minutes) return;
    app.store.addSession({ id: newId(), t: Date.now(), day: dayKey(), title: v.title, source: 'video', sec: minutes * 60, planned: minutes * 60, completed: true, ex: {}, before: null, after: null, feel: [], stuck: [], note: '' });
    toast(`Logged ${minutes} minutes. Nice.`);
  },
};
