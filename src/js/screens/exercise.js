// One exercise: animated figure, how to do it, and ways to make it easier.

import { html, raw } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { mountFigure } from '../ui/figure-view.js';
import { EXERCISE, videoSearchUrl } from '../data/exercises.js';
import { ROUTINES } from '../data/routines.js';
import { AREA_NAME, POSITIONS, CARE_AREAS } from '../data/areas.js';
import { topBar, kindTag, itemTime } from './common.js';
import { t, list } from '../i18n.js';

export function render(app, route) {
  const ex = EXERCISE[route.arg];
  if (!ex) return html`${topBar(t('notFound.title'))}<p>${t('notFound.exercise')}</p>`;
  const care = app.store.state.profile.care || [];
  const flagged = ex.care.filter((c) => care.includes(c));
  const careNames = flagged.map((c) => CARE_AREAS.find((x) => x.id === c).name.toLowerCase());
  const usedIn = ROUTINES.filter((r) => r.items.some(([id]) => id === ex.id));
  return html`
    ${topBar(ex.name)}
    <div class="detail-grid">
      <div class="stage" aria-label="${t('ex.animationOf', { name: ex.name })}">
        <div class="stage-fig" data-ex-fig></div>
        <div class="stage-tools">
          ${ex.sides ? html`<button class="icon-btn" data-act="mirror" aria-pressed="false" aria-label="${t('ex.otherSide')}">${raw(icon('mirror'))}</button>` : ''}
          <button class="icon-btn" data-act="pause-fig" aria-label="${t('ex.pauseAnim')}">${raw(icon('pause'))}</button>
        </div>
      </div>
      <div class="stack" style="--gap:18px">
        <div class="ex-head">
          <h1 class="display" tabindex="-1">${ex.name}</h1>
          ${ex.aka ? html`<p class="aka">${t('ex.yogaName', { aka: ex.aka })}</p>` : ''}
          <div class="row wrap" style="--gap:6px">${kindTag(ex)}<span class="tag">${raw(icon('clock'))}${itemTime(app, ex.id, ex.sec)}</span><span class="tag">${POSITIONS[ex.position]}</span>${ex.props.map((p) => html`<span class="tag">${t('prop.' + p)}</span>`)}</div>
        </div>
        <p class="lede">${ex.summary}</p>
        <div class="stack" style="--gap:6px">
          <span class="glow-key"><i></i>${t('ex.feelIt')}</span>
          <p>${ex.feel}</p>
          ${ex.areas.length ? html`<div class="row wrap" style="--gap:6px">${ex.areas.map((a) => html`<span class="tag glow">${AREA_NAME[a]}</span>`)}</div>` : ''}
        </div>
        <div class="detail-actions">
          <button class="btn btn-lg" data-act="start-exercise" data-id="${ex.id}">${raw(icon('play'))} ${t('ex.practice')}</button>
          <a class="btn btn-lg btn-ghost" href="${videoSearchUrl(ex)}" target="_blank" rel="noopener noreferrer">${raw(icon('video'))} ${t('ex.watch')}</a>
        </div>
      </div>
    </div>

    <section class="section">
      <h2 class="section-title">${t('ex.howTo')}</h2>
      <ol class="steps">${ex.setup.map((s) => html`<li><span>${s}</span></li>`)}</ol>
    </section>
    <section class="section">
      <h2 class="section-title">${t(ex.kind === 'flow' ? 'ex.whileFlow' : ex.kind === 'breath' ? 'ex.whileBreath' : 'ex.whileHold')}</h2>
      <ul class="bullets">${ex.cues.map((c) => html`<li>${c}</li>`)}</ul>
      ${ex.exit ? html`<p class="muted"><strong>${t('ex.comingOut')}</strong> ${ex.exit}</p>` : ''}
    </section>
    <section class="section">
      <div class="ease-grid">
        <div class="ease"><h3>${raw(icon('minus'))}${t('ex.easier')}</h3><p>${ex.easier}</p></div>
        <div class="ease"><h3>${raw(icon('plus'))}${t('ex.deeper')}</h3><p>${ex.deeper}</p></div>
      </div>
      <div class="careful${flagged.length ? ' flag' : ''}">${raw(icon('alert'))}<div>${flagged.length ? html`<strong>${t('ex.careFlag', { areas: list(careNames) })}</strong> ` : ''}${ex.careful}</div></div>
    </section>
    ${usedIn.length ? html`<section class="section"><h2 class="section-title">${t('ex.partOf')}</h2><div class="chips">${usedIn.map((r) => html`<button class="chip" data-go="routine:${r.id}">${r.name}</button>`)}</div></section>` : ''}`;
}

export function mount(app, root, route) {
  const ex = EXERCISE[route.arg];
  const host = root.querySelector('[data-ex-fig]');
  if (ex && host) app.ui.detailFig = mountFigure(host, ex.fig, { mode: 'preview', label: ex.name });
}

export const actions = {
  mirror(app, el) {
    const on = el.getAttribute('aria-pressed') !== 'true';
    el.setAttribute('aria-pressed', String(on));
    if (app.ui.detailFig) app.ui.detailFig.setMirror(on);
  },
  'pause-fig'(app, el) {
    const f = app.ui.detailFig;
    if (!f) return;
    if (f.playing) {
      f.pause();
      el.innerHTML = icon('play');
      el.setAttribute('aria-label', t('ex.playAnim'));
    } else {
      f.play();
      el.innerHTML = icon('pause');
      el.setAttribute('aria-label', t('ex.pauseAnim'));
    }
  },
};
