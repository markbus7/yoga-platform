// Small HTML/CSS charts for the progress screen. Every mark is focusable and
// carries its value in a tooltip; every chart also has a table view.

import { esc } from './dom.js';
import { fmtDay, addDays, weekStart, parseDay } from '../lib/dates.js';

function niceMax(v, steps = [10, 20, 30, 60, 90, 120, 180, 240, 300, 420, 600, 900, 1200]) {
  for (const s of steps) if (v <= s) return s;
  return Math.ceil(v / 600) * 600;
}

const tipAttrs = (value, label) => `data-tip-v="${esc(value)}" data-tip="${esc(label)}" tabindex="0"`;

function tableView(caption, head, rows) {
  if (!rows.length) return '';
  return `<details class="table-view"><summary>Show as a table</summary><table><caption class="sr">${esc(caption)}</caption><thead><tr>${head.map((h) => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></details>`;
}

/** Minutes per week, oldest first. */
export function weeklyChart(weeks) {
  const peak = Math.max(...weeks.map((w) => w.minutes), 0);
  const max = niceMax(Math.max(peak, 10));
  const grid = [0, max / 2, max]
    .map((v) => `<div class="gridline${v === 0 ? ' zero' : ''}" style="bottom:${(v / max) * 100}%"><span>${v}</span></div>`)
    .join('');
  const last = weeks.length - 1;
  const peakIdx = weeks.findIndex((w) => w.minutes === peak && peak > 0);
  const cols = weeks
    .map((w, i) => {
      const h = (w.minutes / max) * 100;
      const cap = (i === last || i === peakIdx) && w.minutes > 0 ? `<span class="cap" style="bottom:${h}%">${w.minutes}</span>` : '';
      const label = `Week of ${fmtDay(w.week)}`;
      return `<button class="col${i === last ? ' current' : ''}" ${tipAttrs(`${w.minutes} min`, label)} aria-label="${esc(label)}: ${w.minutes} minutes">${cap}<span class="bar-fill" style="height:${h}%"></span></button>`;
    })
    .join('');
  // Label every other week so the dates never collide on a phone.
  const labels = weeks.map((w, i) => `<span>${i === last ? 'This week' : (last - i) % 2 === 0 ? fmtDay(w.week) : ''}</span>`).join('');
  return `<div class="cols" role="group" aria-label="Minutes practised per week">${grid}${cols}</div><div class="col-labels" aria-hidden="true">${labels}</div>${tableView('Minutes per week', ['Week of', 'Minutes'], weeks.map((w) => [fmtDay(w.week), w.minutes]))}`;
}

/** Before -> after tension per session (1 = loose, 10 = locked up). */
export function tensionChart(rows) {
  const recent = rows.slice(-12);
  const y = (v) => ((10 - v) / 9) * 100;
  const grid = [10, 5, 1].map((v) => `<div class="gridline" style="top:${y(v)}%"><span>${v}</span></div>`).join('');
  const step = 100 / recent.length;
  const marks = recent
    .map((r, i) => {
      const x = step * (i + 0.5);
      const top = Math.min(y(r.before), y(r.after));
      const h = Math.abs(y(r.before) - y(r.after));
      const label = `${fmtDay(r.day, { weekday: true })} · ${r.title || 'Session'}`;
      return `<button class="db" style="left:${x}%" ${tipAttrs(`${r.before} → ${r.after}`, label)} aria-label="${esc(label)}: tension ${r.before} before, ${r.after} after"><span class="stem" style="top:${top}%;height:${h}%"></span><span class="dot before" style="top:${y(r.before)}%"></span><span class="dot after" style="top:${y(r.after)}%"></span></button>`;
    })
    .join('');
  const first = recent[0];
  const lastR = recent[recent.length - 1];
  return `<div class="legend"><span><i style="background:var(--c1)"></i>Before</span><span><i style="background:var(--c3)"></i>After</span></div>
    <div class="dumb" role="group" aria-label="Tension before and after each session">${grid}${marks}</div>
    <div class="dumb-x" aria-hidden="true"><span>${fmtDay(first.day)}</span><span>${fmtDay(lastR.day)}</span></div>
    ${tableView('Tension before and after', ['Day', 'Session', 'Before', 'After'], recent.map((r) => [fmtDay(r.day, { weekday: true }), r.title || '', r.before, r.after]))}`;
}

function level(min) {
  if (min <= 0) return 0;
  if (min < 10) return 1;
  if (min < 20) return 2;
  if (min < 30) return 3;
  return 4;
}

/** Calendar of the last `weeks` weeks, Monday rows on top. */
export function heatmap(minutesByDay, today, weeks = 16) {
  const start = addDays(weekStart(today), -7 * (weeks - 1));
  let cells = '';
  let prevMonth = -1;
  const practised = [];
  for (let w = 0; w < weeks; w++) {
    const ws = addDays(start, 7 * w);
    const m = parseDay(ws).getMonth();
    const label = m !== prevMonth ? parseDay(ws).toLocaleString('en', { month: 'short' }) : '';
    prevMonth = m;
    cells += `<span class="ml">${label}</span>`;
    for (let d = 0; d < 7; d++) {
      const key = addDays(ws, d);
      const min = Math.round(minutesByDay.get(key) || 0);
      const future = key > today;
      if (min > 0) practised.push([fmtDay(key, { weekday: true }), min]);
      const cls = `heat-cell${future ? ' future' : ` l${level(min)}`}${key === today ? ' today' : ''}`;
      cells += future
        ? `<span class="${cls}" aria-hidden="true"></span>`
        : `<button class="${cls}" ${tipAttrs(min ? `${min} min` : 'Rest day', fmtDay(key, { weekday: true }))} aria-label="${fmtDay(key, { weekday: true })}: ${min ? min + ' minutes' : 'no practice'}"></button>`;
    }
  }
  const scale = `<div class="heat-scale" aria-hidden="true">Less <span class="heat-cell"></span><span class="heat-cell l1"></span><span class="heat-cell l2"></span><span class="heat-cell l3"></span><span class="heat-cell l4"></span> More</div>`;
  return `<div class="heat-wrap"><div class="heat" role="group" aria-label="Practice calendar">${cells}</div></div>${scale}${tableView('Days practised', ['Day', 'Minutes'], practised.reverse())}`;
}

/** First vs latest level on each flexibility test. */
export function flexChart(tests, progress) {
  const rows = tests
    .map((t) => {
      const p = progress[t.id];
      if (!p) return '';
      const max = t.levels.length - 1;
      const x = (lv) => (lv / max) * 100;
      const ticks = t.levels.map((_, i) => `<span class="tick" style="left:${x(i)}%"></span>`).join('');
      const lo = Math.min(p.first, p.latest);
      const hi = Math.max(p.first, p.latest);
      const chg = p.change > 0 ? `+${p.change} ${p.change === 1 ? 'level' : 'levels'}` : p.change < 0 ? `${p.change} ${p.change === -1 ? 'level' : 'levels'}` : p.history.length > 1 ? 'No change yet' : 'Baseline';
      return `<div class="level-row">
        <div class="top-line"><span class="n">${esc(t.name)}</span><span class="chg${p.change > 0 ? ' up' : ''}">${chg}</span></div>
        <div class="track"><span class="rail"></span>${ticks}<span class="span" style="left:${x(lo)}%;width:${x(hi) - x(lo)}%"></span>
          ${p.history.length > 1 ? `<button class="pt first" style="left:${x(p.first)}%" ${tipAttrs(t.levels[p.first], 'First check')} aria-label="First check: ${esc(t.levels[p.first])}"></button>` : ''}
          <button class="pt latest" style="left:${x(p.latest)}%" ${tipAttrs(t.levels[p.latest], 'Latest check')} aria-label="Latest check: ${esc(t.levels[p.latest])}"></button>
        </div>
        <div class="track-ends"><span>${esc(t.levels[0])}</span><span>${esc(t.levels[max])}</span></div>
      </div>`;
    })
    .join('');
  const table = tableView(
    'Flexibility check results',
    ['Test', 'First', 'Latest'],
    tests.filter((t) => progress[t.id]).map((t) => [t.name, t.levels[progress[t.id].first], t.levels[progress[t.id].latest]]),
  );
  return `<div class="legend"><span><i style="background:var(--surface);box-shadow:inset 0 0 0 2.5px var(--c1)"></i>First check</span><span><i style="background:var(--c3)"></i>Latest</span></div><div class="levels">${rows}</div>${table}`;
}

/** Horizontal bars of minutes per body area. */
export function areaBars(rows, names) {
  const max = Math.max(...rows.map((r) => r.sec), 1);
  const bars = rows
    .map((r) => {
      const min = Math.round(r.sec / 60);
      return `<div class="hbar"><span class="n">${esc(names[r.area])}</span><span class="track2" ${tipAttrs(`${min} min`, names[r.area])} aria-label="${esc(names[r.area])}: ${min} minutes"><span class="fill" style="width:${(r.sec / max) * 100}%"></span></span><span class="v">${min} min</span></div>`;
    })
    .join('');
  return `<div class="hbars">${bars}</div>`;
}

// ---------- one shared tooltip ----------

let tipEl = null;
let hideTimer = 0;
function showTip(target) {
  if (!tipEl) {
    tipEl = document.createElement('div');
    tipEl.className = 'tooltip';
    tipEl.setAttribute('role', 'tooltip');
    document.body.appendChild(tipEl);
  }
  tipEl.replaceChildren();
  const b = document.createElement('b');
  b.textContent = target.getAttribute('data-tip-v') || '';
  const s = document.createElement('div');
  s.textContent = target.getAttribute('data-tip') || '';
  tipEl.append(b, s);
  tipEl.hidden = false;
  const r = target.getBoundingClientRect();
  const w = tipEl.offsetWidth;
  const h = tipEl.offsetHeight;
  let left = r.left + r.width / 2 - w / 2;
  left = Math.max(8, Math.min(window.innerWidth - w - 8, left));
  let top = r.top - h - 8;
  if (top < 8) top = r.bottom + 8;
  tipEl.style.left = left + 'px';
  tipEl.style.top = top + 'px';
}
function hideTip() {
  if (tipEl) tipEl.hidden = true;
}

export function installTooltips(root = document) {
  root.addEventListener('pointerover', (e) => {
    const t = e.target.closest && e.target.closest('[data-tip]');
    if (t) showTip(t);
  });
  root.addEventListener('pointerout', (e) => {
    const t = e.target.closest && e.target.closest('[data-tip]');
    if (t && !t.contains(e.relatedTarget)) hideTip();
  });
  root.addEventListener('focusin', (e) => {
    const t = e.target.closest && e.target.closest('[data-tip]');
    if (t) showTip(t);
  });
  root.addEventListener('focusout', hideTip);
  root.addEventListener('pointerdown', (e) => {
    const t = e.target.closest && e.target.closest('[data-tip]');
    clearTimeout(hideTimer);
    if (t && e.pointerType === 'touch') {
      showTip(t);
      hideTimer = setTimeout(hideTip, 2600);
    } else if (!t) hideTip();
  });
  window.addEventListener('scroll', hideTip, { passive: true });
}
