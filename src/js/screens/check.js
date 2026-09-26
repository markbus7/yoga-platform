// The flexibility check: five self-tests, one screen each.

import { html, raw, toast } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { figureThumb } from '../ui/figure-view.js';
import { TESTS } from '../data/tests.js';
import { POSES } from '../figure/poses.js';
import { dayKey } from '../lib/dates.js';
import { newId } from '../lib/store.js';
import { testProgress } from '../lib/stats.js';
import { topBar } from './common.js';
import { t } from '../i18n.js';

function stateOf(app) {
  if (!app.ui.check) app.ui.check = { step: 0, results: {} };
  return app.ui.check;
}

export function render(app) {
  const c = stateOf(app);
  const prev = testProgress(app.store.state.tests);
  const steps = html`<div class="check-steps" aria-hidden="true">${TESTS.map((_, i) => html`<i class="${i <= c.step - 1 ? 'on' : ''}"></i>`)}</div>`;

  if (c.step === 0) {
    return html`${topBar(t('check.title'))}
      <h1 class="display" tabindex="-1">${t('check.h1')}</h1>
      <div class="section prose stack">
        <p class="lede">${t('check.lede')}</p>
        <ul class="bullets"><li>${t('check.tip1')}</li><li>${t('check.tip2')}</li><li>${t('check.tip3')}</li></ul>
        <div><button class="btn btn-lg" data-act="check-next">${raw(icon('play'))} ${t('check.begin')}</button></div>
      </div>`;
  }
  if (c.step > TESTS.length) {
    const lines = TESTS.map((test) => {
      const lv = c.results[test.id];
      const before = prev[test.id] ? prev[test.id].latest : null;
      const d = lv != null && before != null ? lv - before : null;
      return html`<div class="list-row"><span class="grow"><span class="t" style="display:block">${test.name}</span><span class="d">${lv == null ? t('check.skipped') : test.levels[lv]}</span></span>${d ? html`<span class="delta" style="${d < 0 ? 'color:var(--ink-2)' : ''}">${d > 0 ? '+' : ''}${d}</span>` : ''}</div>`;
    });
    return html`${topBar(t('check.title'))}
      ${steps}
      <h1 class="display" tabindex="-1" style="margin-top:14px">${t('check.results')}</h1>
      <div class="card section" style="padding-block:4px"><div class="list">${lines}</div></div>
      <div class="row wrap section"><button class="btn btn-lg" data-act="check-save">${raw(icon('check'))} ${t('check.save')}</button><button class="btn btn-lg btn-ghost" data-act="check-back">${t('check.change')}</button></div>`;
  }
  const test = TESTS[c.step - 1];
  const sel = c.results[test.id];
  return html`${topBar(t('check.step', { n: c.step, total: TESTS.length }))}
    ${steps}
    <div class="detail-grid section" style="margin-top:16px">
      <div class="stage"><div class="stage-fig">${raw(figureThumb(POSES[test.fig]))}</div></div>
      <div class="stack" style="--gap:14px">
        <h1 class="display" tabindex="-1">${test.name}</h1>
        <p>${test.how}</p>
        <div class="opts" role="group" aria-label="${test.name}">${test.levels.map((l, i) => html`<button class="opt" data-act="check-pick" data-v="${i}" aria-pressed="${sel === i}"><span class="lv">${i + 1}</span><span>${l}</span></button>`)}</div>
        <div class="row wrap"><button class="btn" data-act="check-next" ${sel == null ? raw('disabled style="opacity:.5"') : ''}>${t('check.next')} ${raw(icon('chev'))}</button><button class="btn btn-ghost" data-act="check-skip">${t('check.skip')}</button>${c.step > 1 ? html`<button class="link-btn" data-act="check-back">${t('check.back')}</button>` : ''}</div>
      </div>
    </div>`;
}

export const actions = {
  'check-next'(app) {
    const c = stateOf(app);
    const test = TESTS[c.step - 1];
    if (test && c.results[test.id] == null) return;
    c.step++;
    app.render();
  },
  'check-skip'(app) {
    const c = stateOf(app);
    const test = TESTS[c.step - 1];
    if (test) delete c.results[test.id];
    c.step++;
    app.render();
  },
  'check-back'(app) {
    const c = stateOf(app);
    c.step = Math.max(1, c.step - 1);
    app.render();
  },
  'check-pick'(app, el) {
    const c = stateOf(app);
    const test = TESTS[c.step - 1];
    c.results[test.id] = +el.dataset.v;
    app.render({ keepScroll: true });
  },
  'check-save'(app) {
    const c = stateOf(app);
    if (!Object.keys(c.results).length) {
      toast(t('check.needOne'));
      return;
    }
    app.store.update((s) => {
      s.tests.push({ id: newId(), t: Date.now(), day: dayKey(), results: { ...c.results } });
    });
    app.ui.check = null;
    toast(t('check.saved'));
    app.go('progress', { replace: true });
  },
};
