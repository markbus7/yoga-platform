// Progress: streaks, time, tension before and after, flexibility, badges and history.

import { html, raw, n, ask, toast } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { weeklyChart, tensionChart, heatmap, flexChart, areaBars } from '../ui/charts.js';
import { TESTS } from '../data/tests.js';
import { AREA_NAME } from '../data/areas.js';
import { PROGRAM } from '../data/program.js';
import { dayKey, fmtDay, addDays } from '../lib/dates.js';
import { streak, longestStreak, week, totals, weeklyMinutes, tension, areaSeconds, programStatus, testProgress, daysSinceCheck, earnedBadges, BADGES, stuckSpots } from '../lib/stats.js';

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
  pairs.forEach(([before, after], i) => rows.push({ day: addDays(today, -13 + i + Math.floor(i / 3)), before, after, title: 'Example session', t: i }));
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

  const kpis = html`<div class="kpis">
    <div class="kpi"><span class="label">Current streak</span><span class="value">${st.days}<small>${st.days === 1 ? 'day' : 'days'}</small></span><span class="sub">Best: ${n('day', best)}</span></div>
    <div class="kpi"><span class="label">This week</span><span class="value">${weekDays}<small>of 7 days</small></span><span class="sub">${wk.reduce((a, d) => a + d.minutes, 0)} min so far</span></div>
    <div class="kpi"><span class="label">Time practised</span><span class="value">${tot.minutes >= 120 ? Math.round((tot.minutes / 60) * 10) / 10 : tot.minutes}<small>${tot.minutes >= 120 ? 'hours' : 'min'}</small></span><span class="sub">${n('session', tot.sessions)} on ${n('day', tot.days)}</span></div>
    <div class="kpi"><span class="label">Tension drop</span><span class="value">${ten.avgDrop === null ? '–' : (ten.avgDrop > 0 ? '−' : ten.avgDrop < 0 ? '+' : '') + Math.abs(Math.round(ten.avgDrop * 10) / 10)}<small>${ten.avgDrop === null ? '' : 'points'}</small></span><span class="sub">${ten.rows.length ? `Average of ${n('check-in', ten.rows.length)}` : 'Rate before and after'}</span></div>
  </div>`;

  const plan = html`<div class="panel">
    <div class="panel-head"><h3>Unstuck 30</h3><p>${prog.finished ? 'All 30 days done. Brilliant.' : `${prog.count} of 30 days done. Next up: day ${prog.next}.`}</p></div>
    <div class="plan-grid" role="list" aria-label="Plan days">${PROGRAM.days.map((d) => {
      const done = state.program.done[d.day];
      const cls = done ? 'done' : d.day === prog.next ? 'next' : '';
      return html`<button role="listitem" class="plan-cell ${cls}" data-go="routine:${d.routine}" data-day="${d.day}" data-tip-v="Day ${d.day}" data-tip="${done ? 'Done ' + fmtDay(done) : d.tip[0]}" aria-label="Day ${d.day}${done ? ', done' : ''}">${done ? raw(icon('check')) : d.day}</button>`;
    })}</div>
    <button class="link-btn" data-go="plan">See the whole plan ${raw(icon('chev'))}</button>
  </div>`;

  return html`
    <header class="stack" style="--gap:6px"><h1 class="display" tabindex="-1">Your progress</h1><p class="lede">${hasData ? 'Small, daily sessions add up. Here is what yours add up to.' : 'Finish your first session and this page starts filling in.'}</p></header>
    <section class="section">${kpis}</section>
    <section class="section grid-2">
      ${plan}
      <div class="panel"><div class="panel-head"><h3>Practice calendar</h3><p>Last 16 weeks. Darker means more minutes.</p></div>${raw(heatmap(minutesByDay(s), today))}</div>
    </section>
    ${hasData
      ? html`<section class="section grid-2">
      <div class="panel"><div class="panel-head"><h3>Minutes per week</h3><p>The last 8 weeks.</p></div>${raw(weeklyChart(weeklyMinutes(s, today, 8)))}</div>
      <div class="panel"><div class="panel-head"><h3>Tension before and after</h3><p>${ten.rows.length ? `On a scale of 1 (loose) to 10 (locked up). Average: ${Math.round(ten.avgBefore * 10) / 10} before, ${Math.round(ten.avgAfter * 10) / 10} after.` : 'Rate how tense you feel before and after a session and this chart shows the difference.'}</p></div>
        ${ten.rows.length ? raw(tensionChart(ten.rows)) : html`<div class="empty">Check-ins are on by default. You can switch them off in You.</div>`}
      </div>
    </section>`
      : html`<section class="section">
      <p class="example-note"><span class="tag example">Example</span>This is what these charts look like after two weeks of practice. Your own numbers replace them after your first session.</p>
      <div class="grid-2">
        <div class="panel is-example"><div class="panel-head"><h3>Minutes per week</h3><p>The last 8 weeks.</p></div>${raw(weeklyChart(exampleData(today).weeks))}</div>
        <div class="panel is-example"><div class="panel-head"><h3>Tension before and after</h3><p>On a scale of 1 (loose) to 10 (locked up).</p></div>${raw(tensionChart(exampleData(today).rows))}</div>
      </div>
    </section>`}
    <section class="section grid-2">
      <div class="panel">
        <div class="panel-head"><h3>Flexibility check</h3><p>${since === null ? 'Five quick self-tests. Do one now as your starting point.' : since >= 14 ? `Last check ${since} days ago. Time for the next one.` : `Last check ${since === 0 ? 'today' : since === 1 ? 'yesterday' : since + ' days ago'}. Next one in ${14 - since} days.`}</p></div>
        ${Object.keys(flex).length ? raw(flexChart(TESTS, flex)) : ''}
        <div><button class="btn ${since === null || since >= 14 ? '' : 'btn-ghost'}" data-go="check">${raw(icon('target'))} ${since === null ? 'Take the first check' : 'Take the check'}</button></div>
      </div>
      <div class="panel">
        <div class="panel-head"><h3>What you've worked on</h3><p>Minutes per body area, all time.</p></div>
        ${areas.length ? raw(areaBars(areas, AREA_NAME)) : html`<div class="empty">Nothing yet.</div>`}
        ${spots.count ? html`<p class="small muted">Spots you marked as stuck lately: ${spots.spots.slice(0, 4).map((x) => `${AREA_NAME[x.area]} (${x.times}×)`).join(', ')}.</p>` : ''}
      </div>
    </section>
    <section class="section">
      <h2 class="section-title">Milestones</h2>
      <div class="badges">${BADGES.map((b) => {
        const got = badges[b.id];
        return html`<div class="badge${got ? '' : ' locked'}"><span class="b">${raw(icon(BADGE_ICON[b.id] || 'medal'))}</span><span><span class="n" style="display:block">${b.name}</span><span class="d">${got ? 'Earned ' + fmtDay(got) : b.desc}</span></span></div>`;
      })}</div>
    </section>
    <section class="section">
      <div class="section-head"><h2 class="section-title">History</h2>${s.length > 8 ? html`<button class="link-btn" data-act="history-all">${app.ui.historyAll ? 'Show fewer' : `Show all ${s.length}`}</button>` : ''}</div>
      ${history.length ? html`<div class="list">${history.map((x) => {
        const drop = Number.isFinite(x.before) && Number.isFinite(x.after) ? x.before - x.after : null;
        return html`<div class="history-row"><span class="t">${x.title}</span><button class="icon-btn x" data-act="delete-session" data-id="${x.id}" aria-label="Delete this session">${raw(icon('trash'))}</button><span class="d">${fmtDay(x.day, { weekday: true })} · ${Math.max(1, Math.round(x.sec / 60))} min${drop !== null ? ` · tension ${x.before} → ${x.after}` : ''}${x.feel && x.feel.length ? ' · ' + x.feel.join(', ') : ''}${x.note ? ` · “${x.note}”` : ''}</span></div>`;
      })}</div>` : html`<div class="empty"><span>No sessions yet.</span><button class="btn" data-go="today">Go to today's session</button></div>`}
    </section>`;
}

export const actions = {
  'history-all'(app) {
    app.ui.historyAll = !app.ui.historyAll;
    app.render({ keepScroll: true });
  },
  async 'delete-session'(app, el) {
    const ok = await ask('Delete this session?', 'It will be removed from your history and totals.', 'Delete', 'Keep it');
    if (!ok) return;
    app.store.removeSession(el.dataset.id);
    toast('Session deleted');
  },
};
