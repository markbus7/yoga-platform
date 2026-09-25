// Today: the session for today, this week, a tip, and quick ways in.

import { html, raw, n } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { bodyMap } from '../ui/bodymap.js';
import { mountFigure, figureThumb } from '../ui/figure-view.js';
import { ROUTINE } from '../data/routines.js';
import { STYLE_NAME } from '../data/routines.js';
import { PROGRAM } from '../data/program.js';
import { AREA_NAME } from '../data/areas.js';
import { dayKey, partOfDay, weekdayShort } from '../lib/dates.js';
import { streak, week, programStatus, daysSinceCheck } from '../lib/stats.js';
import { featured, routineMinutes, programDayInfo } from './common.js';

const GREETING = { morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening', night: 'Winding down' };
const PICKS = {
  morning: ['wakeup', 'desk', 'breathe', 'neck'],
  afternoon: ['desk', 'neck', 'breathe', 'hipsback'],
  evening: ['gravity', 'winddown', 'hipsback', 'breathe'],
  night: ['winddown', 'breathe', 'gravity', 'upper'],
};
const SUGGEST = { morning: 'wakeup', afternoon: 'desk', evening: 'gravity', night: 'winddown' };

function heroFor(app, today) {
  const { state } = app.store;
  const prog = programStatus(state.program, today);
  const part = partOfDay();
  if (prog.finished) {
    const r = ROUTINE[SUGGEST[part]];
    return { routine: r, day: null, eyebrow: 'Unstuck 30 complete · Suggested now', done: false };
  }
  if (prog.doneToday) {
    const doneDay = Object.entries(state.program.done).find(([, d]) => d === today);
    const next = prog.next;
    const info = programDayInfo(next);
    return { routine: ROUTINE[info.routine], day: next, eyebrow: `Tomorrow · Day ${next} of 30`, done: true, doneDay: doneDay ? +doneDay[0] : null };
  }
  const info = programDayInfo(prog.next);
  return { routine: ROUTINE[info.routine], day: prog.next, eyebrow: `Day ${prog.next} of 30 · Week ${info.week}: ${info.weekInfo.name}`, done: false };
}

export function render(app) {
  const { state } = app.store;
  const today = dayKey();
  const st = streak(state.sessions, today);
  const wk = week(state.sessions, today);
  const part = partOfDay();
  const name = state.profile.name.trim();
  const hero = heroFor(app, today);
  const r = hero.routine;
  const weekDone = wk.filter((d) => d.done).length;
  const weekMin = wk.reduce((a, d) => a + d.minutes, 0);
  const prog = programStatus(state.program, today);
  const tipDay = hero.done ? hero.doneDay || prog.next : hero.day;
  const tip = tipDay ? PROGRAM.days[tipDay - 1].tip : ['Keep the habit', 'Pick any routine you enjoyed. Ten minutes a day keeps you loose.'];
  const picks = PICKS[part].filter((id) => id !== r.id).slice(0, 4);
  const since = daysSinceCheck(state.tests, today);
  const stuck = app.ui.stuck;

  const streakChip = st.days
    ? html`<span class="streak" title="Days in a row">${raw(icon('flame'))}${n('day', st.days)}</span>`
    : html`<span class="streak cold">${raw(icon('flame'))}Start a streak</span>`;

  const heroBody = hero.done
    ? html`<div class="hero-done">${raw(icon('check'))}<span>Day ${hero.doneDay} is done. See you tomorrow.</span></div>
        <div class="hero-actions"><button class="btn btn-on-card" data-go="routine:${r.id}" data-day="${hero.day}">Preview day ${hero.day}</button><button class="link-btn" data-go="build">Extra: build a short session ${raw(icon('chev'))}</button></div>`
    : html`<div class="hero-actions"><button class="btn btn-lg btn-on-card" data-act="start-routine" data-id="${r.id}" data-day="${hero.day || ''}">${raw(icon('play'))} Start</button><button class="link-btn" data-go="routine:${r.id}" data-day="${hero.day || ''}">See what's inside ${raw(icon('chev'))}</button></div>`;

  const checkCard = since === null
    ? html`<button class="list-row" data-go="check"><span class="tip-mark">${raw(icon('target'))}</span><span class="grow"><span class="t" style="display:block">Take your baseline flexibility check</span><span class="d">Five quick self-tests, about 3 minutes. Repeat every two weeks to see progress.</span></span>${raw(icon('chev', 'chev'))}</button>`
    : since >= 14
      ? html`<button class="list-row" data-go="check"><span class="tip-mark">${raw(icon('target'))}</span><span class="grow"><span class="t" style="display:block">Time for a flexibility check</span><span class="d">${since} days since your last one.</span></span>${raw(icon('chev', 'chev'))}</button>`
      : '';

  return html`
  <header class="top"><span class="wordmark" aria-label="Unstuck">unstuck</span>${streakChip}</header>
  <div class="greet">
    <h1 class="display" tabindex="-1">${GREETING[part]}${name ? `, ${name}` : ''}.</h1>
    <p class="lede">${hero.done ? 'Today is done. Anything extra is a bonus.' : part === 'night' ? 'Something slow before sleep?' : 'Ten easy minutes to feel less stuck.'}</p>
  </div>

  <section class="hero on-color" data-color="${r.color}" aria-label="Today's session">
    <div class="hero-stage" data-fig="${featured(r).id}"></div>
    <div class="hero-body">
      <span class="eyebrow">${hero.eyebrow}</span>
      <h2>${r.name}</h2>
      <div class="meta"><span>${raw(icon('clock'))}${routineMinutes(app, r, hero.day)} min</span><span>${raw(icon('layers'))}${STYLE_NAME[r.style]}</span><span>${n('exercise', r.items.length)}</span></div>
      ${heroBody}
    </div>
  </section>

  <button class="plan-row" data-go="plan" aria-label="Unstuck 30 plan: ${prog.count} of 30 days done">
    <span>Unstuck 30</span><span class="plan-bar" aria-hidden="true"><i style="width:${(prog.count / 30) * 100}%"></i></span><span class="muted">${prog.count}/30</span>${raw(icon('chev'))}
  </button>

  <section class="section" aria-labelledby="wk">
    <div class="section-head"><h2 class="section-title" id="wk">This week</h2><span class="muted small">${weekDone} of 7 days · ${weekMin} min</span></div>
    <div class="week">${wk.map((d) => html`<div class="week-day${d.done ? ' done' : ''}${d.today ? ' today' : ''}${d.future ? ' future' : ''}"><span class="week-dot" title="${d.minutes ? d.minutes + ' min' : ''}">${d.done ? raw(icon('check')) : ''}</span><span>${weekdayShort(d.key).slice(0, 2)}</span></div>`)}</div>
  </section>

  <section class="section" aria-label="Tip of the day">
    <div class="tip"><span class="mark">${raw(icon('sparkle'))}</span><div><h3>${tip[0]}</h3><p>${tip[1]}</p></div></div>
    ${checkCard ? html`<div class="card" style="padding:4px 16px">${checkCard}</div>` : ''}
  </section>

  <section class="section" aria-labelledby="stuck-h">
    <div class="section-head"><h2 class="section-title" id="stuck-h">Where do you feel stuck?</h2></div>
    <div class="card stuck">
      <div data-stuck-map>${raw(bodyMap(stuck))}</div>
      <div class="stack">
        <p class="muted">Tap the spots that feel tight. You'll get a session just for them.</p>
        <p class="small" data-stuck-list>${stuck.size ? [...stuck].map((a) => AREA_NAME[a]).join(', ') : 'Nothing picked yet: you will get a whole-body session.'}</p>
        <div><button class="btn" data-go="build">${raw(icon('sparkle'))} Build my session</button></div>
      </div>
    </div>
  </section>

  <section class="section" aria-labelledby="picks-h">
    <div class="section-head"><h2 class="section-title" id="picks-h">Good for right now</h2><button class="link-btn" data-go="explore">All routines ${raw(icon('chev'))}</button></div>
    <div class="picks">${picks.map((id) => {
      const p = ROUTINE[id];
      return html`<button class="pick on-color" data-color="${p.color}" data-go="routine:${p.id}"><span class="thumb">${raw(figureThumb(featured(p).fig, { glow: false }))}</span><span class="n">${p.name}</span><span class="m">${routineMinutes(app, p)} min · ${STYLE_NAME[p.style]}</span></button>`;
    })}</div>
  </section>`;
}

export function mount(app, root) {
  const stage = root.querySelector('[data-fig]');
  if (stage) {
    const ex = app.exercise(stage.dataset.fig);
    mountFigure(stage, ex.fig, { mode: 'preview', label: ex.name });
  }
}

export const actions = {
  area(app, el) {
    const a = el.dataset.area;
    if (app.ui.stuck.has(a)) app.ui.stuck.delete(a);
    else app.ui.stuck.add(a);
    const root = el.closest('.view');
    root.querySelector('[data-stuck-map]').innerHTML = bodyMap(app.ui.stuck);
    root.querySelector('[data-stuck-list]').textContent = app.ui.stuck.size ? [...app.ui.stuck].map((x) => AREA_NAME[x]).join(', ') : 'Nothing picked yet: you will get a whole-body session.';
    const again = root.querySelector(`[data-stuck-map] [data-area="${a}"]`);
    if (again) again.focus({ preventScroll: true });
  },
};
