// The whole Unstuck 30 plan, week by week.

import { html, raw, ask, toast } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { PROGRAM } from '../data/program.js';
import { ROUTINE } from '../data/routines.js';
import { dayKey, fmtDay } from '../lib/dates.js';
import { programStatus } from '../lib/stats.js';
import { topBar, routineMinutes } from './common.js';
import { t } from '../i18n.js';

export function render(app) {
  const { state } = app.store;
  const prog = programStatus(state.program, dayKey());
  return html`${topBar('Unstuck 30')}
    <h1 class="display" tabindex="-1">Unstuck 30</h1>
    <p class="lede" style="margin-top:8px">${PROGRAM.about}</p>
    <p class="small muted" style="margin-top:6px">${t('planScreen.count', { n: prog.count })}</p>
    ${PROGRAM.weeks.map((w) => {
      const days = PROGRAM.days.filter((d) => (w.n < 4 ? d.week === w.n : d.week >= 4));
      return html`<section class="section">
        <div class="section-head"><h2 class="section-title">${t('planScreen.week', { n: w.n, name: w.name })}</h2><span class="muted small">${t('planScreen.holds', { pct: Math.round(w.hold * 100) })}</span></div>
        <p class="muted">${w.about}</p>
        <div class="card" style="padding-block:4px"><div class="list">${days.map((d) => {
          const r = ROUTINE[d.routine];
          const done = state.program.done[d.day];
          const isNext = d.day === prog.next;
          return html`<button class="list-row" data-go="routine:${r.id}" data-day="${d.day}">
            <span class="plan-cell ${done ? 'done' : isNext ? 'next' : ''}" style="width:40px;flex:none">${done ? raw(icon('check')) : d.day}</span>
            <span class="grow"><span class="t" style="display:block">${r.name}${d.check ? t('planScreen.check') : ''}</span><span class="d">${done ? t('planScreen.done', { date: fmtDay(done) }) : t('common.min', { n: routineMinutes(app, r, d.day) })} · ${d.tip[0]}</span></span>
            ${raw(icon('chev', 'chev'))}</button>`;
        })}</div></div></section>`;
    })}
    <section class="section"><div><button class="btn btn-ghost" data-act="plan-restart">${raw(icon('refresh'))} ${t('planScreen.restart')}</button></div><p class="small muted">${t('planScreen.restartNote')}</p></section>`;
}

export const actions = {
  async 'plan-restart'(app) {
    const ok = await ask(t('planScreen.restartQ'), t('planScreen.restartBody'), t('planScreen.restartYes'), t('common.cancel'));
    if (!ok) return;
    app.store.update((s) => {
      s.program = { startedAt: null, done: {} };
    });
    toast(t('planScreen.restartDone'));
  },
};
