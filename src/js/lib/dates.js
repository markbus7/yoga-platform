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

const NAMES = {
  en: {
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  },
  nl: {
    days: ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'],
    months: ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'],
  },
};
let names = NAMES.en;

/** Switch month and weekday names ('en' or 'nl'). */
export function setDateLocale(lang) {
  names = NAMES[lang] || NAMES.en;
}

export function weekdayShort(key) {
  return names.days[(parseDay(key).getDay() + 6) % 7];
}

export function monthShort(key) {
  return names.months[parseDay(key.length === 7 ? key + '-01' : key).getMonth()];
}

export function fmtDay(key, { weekday = false } = {}) {
  const d = parseDay(key);
  const s = `${d.getDate()} ${names.months[d.getMonth()]}`;
  return weekday ? `${weekdayShort(key)} ${s}` : s;
}

export function fmtMonth(key) {
  const d = parseDay(key.length === 7 ? key + '-01' : key);
  return `${names.months[d.getMonth()]} ${d.getFullYear()}`;
}

/** 95 -> "1:35" */
export function fmtClock(sec) {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${pad(s % 60)}`;
}

export function partOfDay(d = new Date()) {
  const h = d.getHours();
  if (h < 5) return 'night';
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  if (h < 22) return 'evening';
  return 'night';
}
