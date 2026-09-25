// Local-calendar day helpers. Days are 'YYYY-MM-DD' strings in local time.

const pad = (n) => String(n).padStart(2, '0');

export function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseDay(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key, n) {
  const d = parseDay(key);
  d.setDate(d.getDate() + n);
  return dayKey(d);
}

/** Whole days from `a` to `b` (positive when b is later). */
export function daysBetween(a, b) {
  const ms = parseDay(b) - parseDay(a);
  return Math.round(ms / 86400000);
}

/** Monday of the week containing `key`. */
export function weekStart(key) {
  const d = parseDay(key);
  const dow = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dow);
  return dayKey(d);
}

export function monthKey(key) {
  return key.slice(0, 7);
}

const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function weekdayShort(key) {
  return DAY_SHORT[(parseDay(key).getDay() + 6) % 7];
}

export function fmtDay(key, { weekday = false } = {}) {
  const d = parseDay(key);
  const s = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return weekday ? `${weekdayShort(key)} ${s}` : s;
}

export function fmtMonth(key) {
  const d = parseDay(key.length === 7 ? key + '-01' : key);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** 95 -> "1:35" */
export function fmtClock(sec) {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${pad(s % 60)}`;
}

/** 610 -> "10 min", 45 -> "45 sec" */
export function fmtLength(sec) {
  if (sec < 60) return `${Math.round(sec)} sec`;
  return `${Math.round(sec / 60)} min`;
}

export function partOfDay(d = new Date()) {
  const h = d.getHours();
  if (h < 5) return 'night';
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  if (h < 22) return 'evening';
  return 'night';
}
