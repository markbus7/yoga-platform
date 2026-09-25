// Progress: streaks, time, tension before and after, flexibility, badges and history.

import { html, raw, ask, toast } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { weeklyChart, tensionChart, heatmap, flexChart, areaBars } from '../ui/charts.js';
import { TESTS } from '../data/tests.js';
import { AREA_NAME } from '../data/areas.js';
import { PROGRAM } from '../data/program.js';
import { dayKey, fmtDay, addDays } from '../lib/dates.js';
import { streak, longestStreak, week, totals, weeklyMinutes, tension, areaSeconds, programStatus, testProgress, daysSinceCheck, earnedBadges, BADGES, stuckSpots } from '../lib/stats.js';
import { sessionTitle, feelingName } from './common.js';
import { t, num, inline } from '../i18n.js';

const BADGE_ICON = { first: 'leaf', streak3: 'flame', streak7: 'flame', streak14: 'flame', streak30: 'flame', sessions10: 'medal', sessions50: 'medal', hour1: 'clock', hour10: 'clock', gravity5: 'moon', calm: 'wind', check1: 'target', looser: 'sparkle', week1: 'calendar', program: 'medal' };

function minutesByDay(sessions) {
  const m = new Map();
  for (const s of sessions) m.set(s.day, (m.get(s.day) || 0) + (s.sec || 0) / 60);
  return m;
}

/** Made-up numbers that show what the charts look like, clearly marked as an example. */
function exampleData(today) {
  const rows = [];
  const pairs = [[7, 5], [8, 5], [6, 4], [7, 4], [6, 4], [7, 3], [5, 3], [6, 3], [6, 3], [5, 2]];
  pairs.forEach(([before, after], i) => rows.push({ day: addDays(today, -13 + i + Math.floor(i / 3)), before, after, title: t('example.session'), t: i }));
  const weeks = weeklyMinutes([], today, 8).map((w, i) => ({ ...w, minutes: [0, 0, 0, 0, 0, 0, 74, 96][i] }));
  return { rows, weeks };
}

export function render(app) {
  const { state } = app.store;
  const today = dayKey();
  const s = state.sessions;
  const st = streak(s, today);
  const best = longestStreak(s);
  const wk = week(s, today);
  const tot = totals(s);
  const ten = tension(s);
  const prog = programStatus(state.program, today);
  const flex = testProgress(state.tests);
  const since = daysSinceCheck(state.tests, today);
  const badges = earnedBadges(state);
  const areas = areaSeconds(s).slice(0, 8);
  const spots = stuckSpots(s);
  const history = [...s].sort((a, b) => b.t - a.t).slice(0, app.ui.historyAll ? 200 : 8);
  const weekDays = wk.filter((d) => d.done).length;
  const hasData = s.length > 0;

  const flexWhen = since === 0 ? t('flex.today') : since === 1 ? t('flex.yesterday') : t('flex.daysAgo', { n: since });
  const flexSub = since === null ? t('flex.subNone') : since >= 14 ? t('flex.subDue', { n: since }) : t('flex.subRecent', { when: flexWhen, days: t('count.days', { n: 14 - since }) });
  const drop = ten.avgDrop === null ? '–' : (ten.avgDrop > 0 ? '−' : ten.avgDrop < 0 ? '+' : '') + num(Math.abs(ten.avgDrop));

  const kpis = html`<div class="kpis">
    <div class="kpi"><span class="label">${t('kpi.streak')}</span><span class="value">${st.days}<small>${t('kpi.dayUnit', { n: st.days })}</small></span><span class="sub">${t('kpi.best', { days: t('count.days', { n: best }) })}</span></div>
    <div class="kpi"><span class="label">${t('kpi.week')}</span><span class="value">${weekDays}<small>${t('kpi.weekValue')}</small></span><span class="sub">${t('kpi.weekSub', { n: wk.reduce((a, d) => a + d.minutes, 0) })}</span></div>
    <div class="kpi"><span class="label">${t('kpi.time')}</span><span class="value">${tot.minutes >= 120 ? num(tot.minutes / 60) : tot.minutes}<small>${tot.minutes >= 120 ? t('kpi.hours') : t('kpi.min')}</small></span><span class="sub">${t('kpi.timeSub', { sessions: t('count.sessions', { n: tot.sessions }), days: t('count.days', { n: tot.days }) })}</span></div>
    <div class="kpi"><span class="label">${t('kpi.tension')}</span><span class="value">${drop}<small>${ten.avgDrop === null ? '' : t('kpi.points')}</small></span><span class="sub">${ten.rows.length ? t('kpi.tensionSub', { n: t('count.checkins', { n: ten.rows.length }) }) : t('kpi.tensionNone')}</span></div>
  </div>`;

  const plan = html`<div class="panel">
    <div class="panel-head"><h3>${t('plan.title')}</h3><p>${prog.finished ? t('plan.finished') : t('plan.status', { done: prog.count, next: prog.next })}</p></div>
    <div class="plan-grid" role="list" aria-label="${t('plan.daysAria')}">${PROGRAM.days.map((d) => {
      const done = state.program.done[d.day];
      const cls = done ? 'done' : d.day === prog.next ? 'next' : '';
      return html`<button role="listitem" class="plan-cell ${cls}" data-go="routine:${d.routine}" data-day="${d.day}" data-tip-v="${t('plan.cellDay', { day: d.day })}" data-tip="${done ? t('plan.cellDone', { date: fmtDay(done) }) : d.tip[0]}" aria-label="${done ? t('plan.cellDoneAria', { day: d.day }) : t('plan.cellDay', { day: d.day })}">${done ? raw(icon('check')) : d.day}</button>`;
    })}</div>
    <button class="link-btn" data-go="plan">${t('plan.seeAll')} ${raw(icon('chev'))}</button>
  </div>`;

  const weeklyPanel = (weeks, cls = '') => html`<div class="panel${cls}"><div class="panel-head"><h3>${t('weekly.title')}</h3><p>${t('weekly.sub')}</p></div>${raw(weeklyChart(weeks))}</div>`;

  return html`
    <header class="stack" style="--gap:6px"><h1 class="display" tabindex="-1">${t('progress.title')}</h1><p class="lede">${hasData ? t('progress.ledeData') : t('progress.ledeEmpty')}</p></header>
    <section class="section">${kpis}</section>
    <section class="section grid-2">
      ${plan}
      <div class="panel"><div class="panel-head"><h3>${t('cal.title')}</h3><p>${t('cal.sub')}</p></div>${raw(heatmap(minutesByDay(s), today))}</div>
    </section>
    ${hasData
      ? html`<section class="section grid-2">
      ${weeklyPanel(weeklyMinutes(s, today, 8))}
      <div class="panel"><div class="panel-head"><h3>${t('tension.title')}</h3><p>${ten.rows.length ? t('tension.subData', { before: num(ten.avgBefore), after: num(ten.avgAfter) }) : t('tension.subEmpty')}</p></div>
        ${ten.rows.length ? raw(tensionChart(ten.rows.map((r) => ({ ...r, title: sessionTitle(r) })))) : html`<div class="empty">${t('tension.checkinsOn')}</div>`}
      </div>
    </section>`
      : html`<section class="section">
      <p class="example-note"><span class="tag example">${t('example.tag')}</span>${t('example.note')}</p>
      <div class="grid-2">
        ${weeklyPanel(exampleData(today).weeks, ' is-example')}
        <div class="panel is-example"><div class="panel-head"><h3>${t('tension.title')}</h3><p>${t('tension.scale')}</p></div>${raw(tensionChart(exampleData(today).rows))}</div>
      </div>
    </section>`}
    <section class="section grid-2">
      <div class="panel">
        <div class="panel-head"><h3>${t('flex.title')}</h3><p>${flexSub}</p></div>
        ${Object.keys(flex).length ? raw(flexChart(TESTS, flex)) : ''}
        <div><button class="btn ${since === null || since >= 14 ? '' : 'btn-ghost'}" data-go="check">${raw(icon('target'))} ${since === null ? t('flex.takeFirst') : t('flex.take')}</button></div>
      </div>
      <div class="panel">
        <div class="panel-head"><h3>${t('areas.title')}</h3><p>${t('areas.sub')}</p></div>
        ${areas.length ? raw(areaBars(areas, AREA_NAME)) : html`<div class="empty">${t('areas.none')}</div>`}
        ${spots.count ? html`<p class="small muted">${t('areas.stuck', { list: spots.spots.slice(0, 4).map((x) => `${inline(AREA_NAME[x.area])} (${x.times}×)`).join(', ') })}</p>` : ''}
      </div>
    </section>
    <section class="section">
      <h2 class="section-title">${t('milestones')}</h2>
      <div class="badges">${BADGES.map((b) => {
        const got = badges[b.id];
        return html`<div class="badge${got ? '' : ' locked'}"><span class="b">${raw(icon(BADGE_ICON[b.id] || 'medal'))}</span><span><span class="n" style="display:block">${b.name}</span><span class="d">${got ? t('badge.earned', { date: fmtDay(got) }) : b.desc}</span></span></div>`;
      })}</div>
    </section>
    <section class="section">
      <div class="section-head"><h2 class="section-title">${t('history')}</h2>${s.length > 8 ? html`<button class="link-btn" data-act="history-all">${app.ui.historyAll ? t('history.showFewer') : t('history.showAll', { n: s.length })}</button>` : ''}</div>
      ${history.length ? html`<div class="list">${history.map((x) => {
        const drop = Number.isFinite(x.before) && Number.isFinite(x.after) ? x.before - x.after : null;
        const bits = [fmtDay(x.day, { weekday: true }), t('common.min', { n: Math.max(1, Math.round(x.sec / 60)) })];
        if (drop !== null) bits.push(t('history.tension', { before: x.before, after: x.after }));
        if (x.feel && x.feel.length) bits.push(x.feel.map(feelingName).join(', '));
        if (x.note) bits.push(`“${x.note}”`);
        return html`<div class="history-row"><span class="t">${sessionTitle(x)}</span><button class="icon-btn x" data-act="delete-session" data-id="${x.id}" aria-label="${t('history.delete')}">${raw(icon('trash'))}</button><span class="d">${bits.join(' · ')}</span></div>`;
      })}</div>` : html`<div class="empty"><span>${t('history.none')}</span><button class="btn" data-go="today">${t('history.goToday')}</button></div>`}
    </section>`;
}

export const actions = {
  'history-all'(app) {
    app.ui.historyAll = !app.ui.historyAll;
    app.render({ keepScroll: true });
  },
  async 'delete-session'(app, el) {
    const ok = await ask(t('history.deleteQ'), t('history.deleteBody'), t('history.deleteYes'), t('history.deleteNo'));
    if (!ok) return;
    app.store.removeSession(el.dataset.id);
    toast(t('history.deleted'));
  },
};
