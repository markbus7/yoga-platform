// Local-calendar day helpers. Days are 'YYYY-MM-DD' strings in local time.
// "Now" follows the chosen time zone (the device's unless set under You).

const pad = (n) => String(n).padStart(2, '0');

let zone = '';

/** '' follows this device; otherwise an IANA zone such as 'Europe/Amsterdam'. */
export function setTimeZone(tz) {
  zone = tz && validZone(tz) ? tz : '';
}

export function validZone(tz) {
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function deviceZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  } catch {
    return '';
  }
}

/** Year, month (1-12), day, hour and minute right now in the chosen zone. */
export function nowParts(now = new Date()) {
  if (!zone) return { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate(), h: now.getHours(), min: now.getMinutes() };
  const parts = {};
  for (const p of new Intl.DateTimeFormat('en-GB', { timeZone: zone, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(now)) parts[p.type] = +p.value;
  return { y: parts.year, m: parts.month, d: parts.day, h: parts.hour % 24, min: parts.minute };
}

/** The day key of a date, or of today (in the chosen zone) when none is given. */
export function dayKey(d) {
  if (!d) {
    const n = nowParts();
    return `${n.y}-${pad(n.m)}-${pad(n.d)}`;
  }
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

/** Hour each part of the day starts at. Adjustable under You. */
export const DEFAULT_DAY_PARTS = { morning: 5, afternoon: 12, evening: 17, night: 22 };
let dayParts = { ...DEFAULT_DAY_PARTS };

/** Use these start hours when they run in order (morning < afternoon < evening < night). */
export function setDayParts(p) {
  dayParts = validDayParts(p) ? { ...p } : { ...DEFAULT_DAY_PARTS };
}

export function validDayParts(p) {
  if (!p) return false;
  const v = [p.morning, p.afternoon, p.evening, p.night];
  return v.every((x) => Number.isInteger(x) && x >= 0 && x <= 23) && v[0] < v[1] && v[1] < v[2] && v[2] < v[3];
}

/** 'morning' | 'afternoon' | 'evening' | 'night' for a date, or for now in the chosen zone. */
export function partOfDay(d) {
  const h = d ? d.getHours() : nowParts().h;
  if (h < dayParts.morning || h >= dayParts.night) return 'night';
  if (h < dayParts.afternoon) return 'morning';
  if (h < dayParts.evening) return 'afternoon';
  return 'evening';
}
