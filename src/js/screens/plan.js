// The whole Unstuck 30 plan, week by week.

import { html, raw, ask, toast } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { PROGRAM } from '../data/program.js';
import { ROUTINE } from '../data/routines.js';
import { dayKey, fmtDay } from '../lib/dates.js';
import { programStatus } from '../lib/stats.js';
import { topBar, routineMinutes } from './common.js';

export function render(app) {
  const { state } = app.store;
  const prog = programStatus(state.program, dayKey());
  return html`${topBar('Unstuck 30')}
    <h1 class="display" tabindex="-1">Unstuck 30</h1>
    <p class="lede" style="margin-top:8px">${PROGRAM.about}</p>
    <p class="small muted" style="margin-top:6px">${prog.count} of 30 days done. Tap any day to preview or do it.</p>
    ${PROGRAM.weeks.map((w) => {
      const days = PROGRAM.days.filter((d) => (w.n < 4 ? d.week === w.n : d.week >= 4));
      return html`<section class="section">
        <div class="section-head"><h2 class="section-title">Week ${w.n}: ${w.name}</h2><span class="muted small">Holds ${Math.round(w.hold * 100)}%</span></div>
        <p class="muted">${w.about}</p>
        <div class="card" style="padding-block:4px"><div class="list">${days.map((d) => {
          const r = ROUTINE[d.routine];
          const done = state.program.done[d.day];
          const isNext = d.day === prog.next;
          return html`<button class="list-row" data-go="routine:${r.id}" data-day="${d.day}">
            <span class="plan-cell ${done ? 'done' : isNext ? 'next' : ''}" style="width:40px;flex:none">${done ? raw(icon('check')) : d.day}</span>
            <span class="grow"><span class="t" style="display:block">${r.name}${d.check ? ' + flexibility check' : ''}</span><span class="d">${done ? `Done ${fmtDay(done)}` : `${routineMinutes(app, r, d.day)} min`} · ${d.tip[0]}</span></span>
            ${raw(icon('chev', 'chev'))}</button>`;
        })}</div></div></section>`;
    })}
    <section class="section"><div><button class="btn btn-ghost" data-act="plan-restart">${raw(icon('refresh'))} Restart the plan</button></div><p class="small muted">Restarting clears which days are ticked off. Your sessions and progress stay.</p></section>`;
}

export const actions = {
  async 'plan-restart'(app) {
    const ok = await ask('Restart Unstuck 30?', 'Days you ticked off will be cleared so you can start again from day 1. Your session history stays.', 'Restart', 'Cancel');
    if (!ok) return;
    app.store.update((s) => {
      s.program = { startedAt: null, done: {} };
    });
    toast('Plan restarted from day 1');
  },
};
