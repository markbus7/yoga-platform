// Build a session for the spots that feel stuck today.

import { html, raw } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { bodyMap } from '../ui/bodymap.js';
import { figureThumb } from '../ui/figure-view.js';
import { AREAS, AREA_NAME } from '../data/areas.js';
import { EXERCISE } from '../data/exercises.js';
import { buildCustom } from '../lib/builder.js';
import { estimateSeconds } from '../lib/session.js';
import { topBar, itemTime } from './common.js';
import { t, inline } from '../i18n.js';

const MINUTES = [5, 10, 15, 20];
const STYLES = ['mix', 'moving', 'gravity'];
const PLACES = ['mat', 'chair'];

export function items(app) {
  const b = app.ui.build;
  return buildCustom({
    areas: [...app.ui.stuck],
    minutes: b.minutes,
    style: b.style,
    place: b.place,
    care: app.store.state.profile.care || [],
    seed: b.seed,
    scale: app.store.state.settings.hold,
    have: { shakti: !!app.store.state.profile.shakti },
  });
}

function preview(app) {
  const list = items(app);
  const min = Math.round(estimateSeconds(list, { scale: app.store.state.settings.hold, transition: app.store.state.settings.transition }) / 60);
  return html`
    <div class="section-head"><h2 class="section-title">${t('build.yourSession', { n: min })}</h2><button class="link-btn" data-act="shuffle">${raw(icon('shuffle'))} ${t('build.shuffle')}</button></div>
    <div class="list seq">${list.map(({ id, sec }) => {
      const ex = EXERCISE[id];
      return html`<button class="seq-row" data-go="exercise:${id}"><span class="thumb">${raw(figureThumb(ex.fig, { glow: false }))}</span><span><span class="t" style="display:block">${ex.name}</span><span class="d">${ex.areas.map((a) => AREA_NAME[a]).join(' · ')}</span></span><span class="time">${itemTime(app, id, sec)}</span></button>`;
    })}</div>`;
}

export function render(app) {
  const b = app.ui.build;
  const stuck = app.ui.stuck;
  return html`
    ${topBar(t('build.title'))}
    <h1 class="display" tabindex="-1">${t('build.h1')}</h1>
    <div class="grid-2 section" style="align-items:start">
      <div class="card stack">
        <div data-stuck-map>${raw(bodyMap(stuck))}</div>
        <div class="chips" role="group" aria-label="${t('build.areasAria')}">${AREAS.map((a) => html`<button class="chip" data-act="area" data-area="${a.id}" aria-pressed="${stuck.has(a.id)}">${a.name}</button>`)}</div>
      </div>
      <div class="stack" style="--gap:18px">
        <div class="field"><span class="label">${t('build.time')}</span><div class="seg" role="group" aria-label="${t('build.minutesAria')}">${MINUTES.map((m) => html`<button data-act="minutes" data-v="${m}" aria-pressed="${b.minutes === m}">${t('common.min', { n: m })}</button>`)}</div></div>
        <div class="field"><span class="label">${t('build.style')}</span><div class="seg" role="group" aria-label="${t('build.style')}">${STYLES.map((v) => html`<button data-act="style" data-v="${v}" aria-pressed="${b.style === v}">${t('build.style.' + v)}</button>`)}</div></div>
        <div class="field"><span class="label">${t('build.where')}</span><div class="seg" role="group" aria-label="${t('build.where')}">${PLACES.map((v) => html`<button data-act="place" data-v="${v}" aria-pressed="${b.place === v}">${t('build.place.' + v)}</button>`)}</div></div>
        <p class="muted small">${stuck.size ? t('build.focused', { areas: [...stuck].map((a) => inline(AREA_NAME[a])).join(', ') }) : t('build.none')} ${t('build.careNote')}</p>
      </div>
    </div>
    <section class="section" data-preview>${preview(app)}</section>
    <div class="sticky-cta"><button class="btn btn-lg" data-act="start-custom">${raw(icon('play'))} ${t('build.start')}</button></div>`;
}

function refresh(app, el) {
  app.render({ keepScroll: true });
  void el;
}

export const actions = {
  area(app, el) {
    const a = el.dataset.area;
    if (app.ui.stuck.has(a)) app.ui.stuck.delete(a);
    else app.ui.stuck.add(a);
    refresh(app, el);
    const again = document.querySelector(`.view [data-area="${a}"]${el.tagName === 'BUTTON' ? '.chip' : '.bm-hit'}`);
    if (again) again.focus({ preventScroll: true });
  },
  minutes(app, el) {
    app.ui.build.minutes = +el.dataset.v;
    refresh(app, el);
  },
  style(app, el) {
    app.ui.build.style = el.dataset.v;
    refresh(app, el);
  },
  place(app, el) {
    app.ui.build.place = el.dataset.v;
    refresh(app, el);
  },
  shuffle(app, el) {
    app.ui.build.seed++;
    refresh(app, el);
  },
};
