// Today: the session for today, this week, a tip, and quick ways in.

import { html, raw } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { bodyMap } from '../ui/bodymap.js';
import { mountFigure, figureThumb } from '../ui/figure-view.js';
import { ROUTINE, STYLE_NAME } from '../data/routines.js';
import { PROGRAM } from '../data/program.js';
import { AREA_NAME } from '../data/areas.js';
import { dayKey, partOfDay, weekdayShort } from '../lib/dates.js';
import { streak, week, programStatus, daysSinceCheck } from '../lib/stats.js';
import { featured, routineMinutes, programDayInfo, longTitle } from './common.js';
import { t, lang } from '../i18n.js';

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
    return { routine: ROUTINE[SUGGEST[part]], day: null, eyebrow: t('today.eyebrowFinished'), done: false };
  }
  if (prog.doneToday) {
    const doneDay = Object.entries(state.program.done).find(([, d]) => d === today);
    const next = prog.next;
    const info = programDayInfo(next);
    return { routine: ROUTINE[info.routine], day: next, eyebrow: t('today.eyebrowTomorrow', { day: next }), done: true, doneDay: doneDay ? +doneDay[0] : null };
  }
  const info = programDayInfo(prog.next);
  return { routine: ROUTINE[info.routine], day: prog.next, eyebrow: t('today.eyebrowDay', { day: prog.next, week: info.week, name: info.weekInfo.name }), done: false };
}

const stuckText = (stuck) => (stuck.size ? [...stuck].map((a) => AREA_NAME[a]).join(', ') : t('today.stuckNone'));

export function langPill() {
  const l = lang();
  return html`<div class="lang-pill" role="group" aria-label="${t('lang.label')}"><button data-act="lang" data-v="en" aria-pressed="${l === 'en'}" lang="en" title="English">EN</button><button data-act="lang" data-v="nl" aria-pressed="${l === 'nl'}" lang="nl" title="Nederlands">NL</button></div>`;
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
  const tip = tipDay ? PROGRAM.days[tipDay - 1].tip : [t('today.keepTitle'), t('today.keepText')];
  const picks = PICKS[part].filter((id) => id !== r.id).slice(0, 4);
  const since = daysSinceCheck(state.tests, today);
  const stuck = app.ui.stuck;
  const greeting = t('greet.' + part);

  const streakChip = st.days
    ? html`<span class="streak" title="${t('today.streakTitle')}" aria-label="${t('today.streakTitle')}: ${st.days}">${raw(icon('flame'))}${st.days}<span class="unit">${t('kpi.dayUnit', { n: st.days })}</span></span>`
    : html`<span class="streak cold">${raw(icon('flame'))}${t('today.startStreak')}</span>`;

  const heroBody = hero.done
    ? html`<div class="hero-done">${raw(icon('check'))}<span>${t('today.dayDone', { day: hero.doneDay })}</span></div>
        <div class="hero-actions"><button class="btn btn-on-card" data-go="routine:${r.id}" data-day="${hero.day}">${t('today.preview', { day: hero.day })}</button><button class="link-btn" data-go="build">${t('today.extra')} ${raw(icon('chev'))}</button></div>`
    : html`<div class="hero-actions"><button class="btn btn-lg btn-on-card" data-act="start-routine" data-id="${r.id}" data-day="${hero.day || ''}">${raw(icon('play'))} ${t('today.start')}</button><button class="link-btn" data-go="routine:${r.id}" data-day="${hero.day || ''}">${t('today.inside')} ${raw(icon('chev'))}</button></div>`;

  const checkRow = (title, text) =>
    html`<button class="list-row" data-go="check"><span class="tip-mark">${raw(icon('target'))}</span><span class="grow"><span class="t" style="display:block">${title}</span><span class="d">${text}</span></span>${raw(icon('chev', 'chev'))}</button>`;
  const checkCard = since === null
    ? checkRow(t('today.checkFirstTitle'), t('today.checkFirstText'))
    : since >= 14
      ? checkRow(t('today.checkDueTitle'), t('today.checkDueText', { n: since }))
      : '';

  return html`
  <header class="top"><span class="wordmark" aria-label="Unstuck">unstuck</span><div class="row" style="--gap:8px">${langPill()}${streakChip}</div></header>
  <div class="greet">
    <h1 class="display" tabindex="-1">${name ? t('greet.name', { greeting, name }) : t('greet.plain', { greeting })}</h1>
    <p class="lede">${hero.done ? t('today.ledeDone') : part === 'night' ? t('today.ledeNight') : t('today.lede')}</p>
  </div>

  <section class="hero on-color" data-color="${r.color}" aria-label="${t('today.sessionLabel')}">
    <div class="hero-stage" data-fig="${featured(r).id}"></div>
    <div class="hero-body">
      <span class="eyebrow">${hero.eyebrow}</span>
      <h2 class="${longTitle(r.name).trim()}">${r.name}</h2>
      <div class="meta"><span>${raw(icon('clock'))}${t('common.min', { n: routineMinutes(app, r, hero.day) })}</span><span>${raw(icon('layers'))}${STYLE_NAME[r.style]}</span><span>${t('count.exercises', { n: r.items.length })}</span></div>
      ${heroBody}
    </div>
  </section>

  <button class="plan-row" data-go="plan" aria-label="${t('today.planAria', { n: prog.count })}">
    <span>Unstuck 30</span><span class="plan-bar" aria-hidden="true"><i style="width:${(prog.count / 30) * 100}%"></i></span><span class="muted">${prog.count}/30</span>${raw(icon('chev'))}
  </button>

  <section class="section" aria-labelledby="wk">
    <div class="section-head"><h2 class="section-title" id="wk">${t('today.week')}</h2><span class="muted small">${t('today.weekSummary', { done: weekDone, min: weekMin })}</span></div>
    <div class="week">${wk.map((d) => html`<div class="week-day${d.done ? ' done' : ''}${d.today ? ' today' : ''}${d.future ? ' future' : ''}"><span class="week-dot" title="${d.minutes ? t('common.min', { n: d.minutes }) : ''}">${d.done ? raw(icon('check')) : ''}</span><span>${weekdayShort(d.key).slice(0, 2)}</span></div>`)}</div>
  </section>

  <section class="section" aria-label="${t('today.tipAria')}">
    <div class="tip"><span class="mark">${raw(icon('sparkle'))}</span><div><h3>${tip[0]}</h3><p>${tip[1]}</p></div></div>
    ${checkCard ? html`<div class="card" style="padding:4px 16px">${checkCard}</div>` : ''}
  </section>

  <section class="section" aria-labelledby="stuck-h">
    <div class="section-head"><h2 class="section-title" id="stuck-h">${t('today.stuckTitle')}</h2></div>
    <div class="card stuck">
      <div data-stuck-map>${raw(bodyMap(stuck))}</div>
      <div class="stack">
        <p class="muted">${t('today.stuckHelp')}</p>
        <p class="small" data-stuck-list>${stuckText(stuck)}</p>
        <div><button class="btn" data-go="build">${raw(icon('sparkle'))} ${t('today.build')}</button></div>
      </div>
    </div>
  </section>

  <section class="section" aria-labelledby="picks-h">
    <div class="section-head"><h2 class="section-title" id="picks-h">${t('today.picks')}</h2><button class="link-btn" data-go="explore">${t('today.allRoutines')} ${raw(icon('chev'))}</button></div>
    <div class="picks">${picks.map((id) => {
      const p = ROUTINE[id];
      return html`<button class="pick on-color" data-color="${p.color}" data-go="routine:${p.id}"><span class="thumb">${raw(figureThumb(featured(p).fig, { glow: false }))}</span><span class="n">${p.name}</span><span class="m">${t('common.min', { n: routineMinutes(app, p) })} · ${STYLE_NAME[p.style]}</span></button>`;
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
    root.querySelector('[data-stuck-list]').textContent = stuckText(app.ui.stuck);
    const again = root.querySelector(`[data-stuck-map] [data-area="${a}"]`);
    if (again) again.focus({ preventScroll: true });
  },
};
