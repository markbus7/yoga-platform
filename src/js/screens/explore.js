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
import { t, lang } from '../i18n.js';

const TABS = ['routines', 'exercises', 'videos'];
const KINDS = ['all', 'flow', 'hold', 'breath'];

function routinesTab(app) {
  return html`<div class="routine-list">${ROUTINES.map((r) => routineCard(app, r, html`<span>${t('when.' + r.when)}</span>`))}</div>`;
}

function exercisesTab(app) {
  const f = app.ui.explore;
  const list = EXERCISES.filter((ex) => (f.area === 'all' || ex.areas.includes(f.area)) && (f.kind === 'all' || ex.kind === f.kind));
  return html`
    <div class="stack">
      <div class="chips scroll" role="group" aria-label="${t('explore.areaAria')}">
        <button class="chip" data-act="area" data-v="all" aria-pressed="${f.area === 'all'}">${t('explore.wholeBody')}</button>
        ${AREAS.map((a) => html`<button class="chip" data-act="area" data-v="${a.id}" aria-pressed="${f.area === a.id}">${a.name}</button>`)}
      </div>
      <div class="chips" role="group" aria-label="${t('explore.typeAria')}">${KINDS.map((k) => html`<button class="chip" data-act="kind" data-v="${k}" aria-pressed="${f.kind === k}">${k === 'all' ? t('explore.allTypes') : t('explore.kind.' + k)}</button>`)}</div>
      <p class="muted small">${t('explore.count', { n: list.length })}</p>
      <div class="ex-grid">${list.map(exTile)}</div>
    </div>`;
}

const videoCard = (v) => html`<article class="video-card" lang="${v.lang}">
  <span class="row wrap" style="--gap:6px"><span class="tag" lang="${lang()}">${raw(icon('video'))}${v.focus}</span>${v.minutes ? html`<span class="tag">${t('common.min', { n: v.minutes })}</span>` : ''}</span>
  <h3 class="t">${v.title}</h3>
  ${v.teacher ? html`<p class="who">${v.teacher}</p>` : ''}
  <p class="why" lang="${lang()}">${v.why}</p>
  <div class="row wrap" lang="${lang()}"><a class="btn btn-small" href="${v.url}" target="_blank" rel="noopener noreferrer">${t('videos.watch')} ${raw(icon('external'))}</a><button class="btn btn-small btn-ghost" data-act="log-video" data-id="${v.id}">${raw(icon('check'))} ${t('videos.did')}</button></div>
</article>`;

function videosTab() {
  // Classes in the app's language first, then the rest.
  const order = lang() === 'nl' ? ['nl', 'en'] : ['en', 'nl'];
  return html`
    <p class="lede">${t('videos.lede')}</p>
    ${order.map((l) => {
      const list = VIDEOS.filter((v) => v.lang === l);
      return html`<h2 class="section-title video-group">${t('videos.group.' + l)}</h2><div class="video-list">${list.map(videoCard)}</div>`;
    })}`;
}

export function render(app) {
  const tab = app.ui.explore.tab;
  const body = tab === 'routines' ? routinesTab(app) : tab === 'exercises' ? exercisesTab(app) : videosTab();
  return html`
    <header class="stack" style="--gap:14px">
      <h1 class="display" tabindex="-1">${t('explore.title')}</h1>
      <div class="seg" role="group" aria-label="${t('explore.show')}">${TABS.map((id) => html`<button data-act="tab" data-v="${id}" aria-pressed="${tab === id}">${t('explore.tab.' + id)}</button>`)}</div>
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
      () => `<h2>${esc(t('videos.logTitle', { title: v.title }))}</h2>
        <div class="field"><label for="lv-min">${esc(t('videos.logQ'))}</label>
        <input id="lv-min" class="input" type="number" inputmode="numeric" min="1" max="180" value="${v.minutes || 15}"></div>
        <div class="row wrap"><button class="btn" data-a="ok">${icon('check')} ${esc(t('common.save'))}</button><button class="btn btn-ghost" data-a="no">${esc(t('common.cancel'))}</button></div>`,
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
    app.store.addSession({ id: newId(), t: Date.now(), day: dayKey(), title: v.title, videoId: v.id, source: 'video', sec: minutes * 60, planned: minutes * 60, completed: true, ex: {}, before: null, after: null, feel: [], stuck: [], note: '' });
    toast(t('videos.logged', { n: minutes }));
  },
};
