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

function stateOf(app) {
  if (!app.ui.check) app.ui.check = { step: 0, results: {} };
  return app.ui.check;
}

export function render(app) {
  const c = stateOf(app);
  const prev = testProgress(app.store.state.tests);
  const steps = html`<div class="check-steps" aria-hidden="true">${TESTS.map((_, i) => html`<i class="${i <= c.step - 1 ? 'on' : ''}"></i>`)}</div>`;

  if (c.step === 0) {
    return html`${topBar('Flexibility check')}
      <h1 class="display" tabindex="-1">How loose are you today?</h1>
      <div class="section prose stack">
        <p class="lede">Five quick self-tests. No measuring tape, you just pick the description that fits. Do it every two weeks and watch the answers change.</p>
        <ul class="bullets"><li>Warm up first: a minute of shoulder rolls and hip circles is enough.</li><li>Go to your comfortable limit. No bouncing, no forcing.</li><li>Be honest. Nobody else sees this.</li></ul>
        <div><button class="btn btn-lg" data-act="check-next">${raw(icon('play'))} Begin</button></div>
      </div>`;
  }
  if (c.step > TESTS.length) {
    const lines = TESTS.map((t) => {
      const lv = c.results[t.id];
      const before = prev[t.id] ? prev[t.id].latest : null;
      const d = lv != null && before != null ? lv - before : null;
      return html`<div class="list-row"><span class="grow"><span class="t" style="display:block">${t.name}</span><span class="d">${lv == null ? 'Skipped' : t.levels[lv]}</span></span>${d ? html`<span class="delta" style="${d < 0 ? 'color:var(--ink-2)' : ''}">${d > 0 ? '+' : ''}${d}</span>` : ''}</div>`;
    });
    return html`${topBar('Flexibility check')}
      ${steps}
      <h1 class="display" tabindex="-1" style="margin-top:14px">Your results</h1>
      <div class="card section" style="padding-block:4px"><div class="list">${lines}</div></div>
      <div class="row wrap section"><button class="btn btn-lg" data-act="check-save">${raw(icon('check'))} Save results</button><button class="btn btn-lg btn-ghost" data-act="check-back">Change an answer</button></div>`;
  }
  const t = TESTS[c.step - 1];
  const sel = c.results[t.id];
  return html`${topBar(`Test ${c.step} of ${TESTS.length}`)}
    ${steps}
    <div class="detail-grid section" style="margin-top:16px">
      <div class="stage"><div class="stage-fig">${raw(figureThumb(POSES[t.fig]))}</div></div>
      <div class="stack" style="--gap:14px">
        <h1 class="display" tabindex="-1">${t.name}</h1>
        <p>${t.how}</p>
        <div class="opts" role="group" aria-label="${t.name}">${t.levels.map((l, i) => html`<button class="opt" data-act="check-pick" data-v="${i}" aria-pressed="${sel === i}"><span class="lv">${i + 1}</span><span>${l}</span></button>`)}</div>
        <div class="row wrap"><button class="btn" data-act="check-next" ${sel == null ? raw('disabled style="opacity:.5"') : ''}>Next ${raw(icon('chev'))}</button><button class="btn btn-ghost" data-act="check-skip">Skip this one</button>${c.step > 1 ? html`<button class="link-btn" data-act="check-back">Back</button>` : ''}</div>
      </div>
    </div>`;
}

export const actions = {
  'check-next'(app) {
    const c = stateOf(app);
    const t = TESTS[c.step - 1];
    if (t && c.results[t.id] == null) return;
    c.step++;
    app.render();
  },
  'check-skip'(app) {
    const c = stateOf(app);
    const t = TESTS[c.step - 1];
    if (t) delete c.results[t.id];
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
    const t = TESTS[c.step - 1];
    c.results[t.id] = +el.dataset.v;
    app.render({ keepScroll: true });
  },
  'check-save'(app) {
    const c = stateOf(app);
    if (!Object.keys(c.results).length) {
      toast('Answer at least one test to save');
      return;
    }
    app.store.update((s) => {
      s.tests.push({ id: newId(), t: Date.now(), day: dayKey(), results: { ...c.results } });
    });
    app.ui.check = null;
    toast('Flexibility check saved');
    app.go('progress', { replace: true });
  },
};
