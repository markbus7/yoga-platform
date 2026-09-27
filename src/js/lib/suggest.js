// What Today suggests, depending on the time of day.
//
// Parts of the day, in local time (see partOfDay in dates.js):
//   morning 05:00–11:59 · afternoon 12:00–16:59 · evening 17:00–21:59 · night 22:00–04:59

/** The routine that suits each part of the day when there is no plan day to do. */
export const FOR_NOW = { morning: 'wakeup', afternoon: 'desk', evening: 'gravity', night: 'winddown' };

/**
 * False when a routine is clearly meant for another time: waking up in the
 * evening, winding down for bed in the morning, a desk break late at night.
 * @param {string} when  the routine's `when` (morning, day, evening, night, any, weekend)
 */
export function fitsNow(when, part) {
  if (when === 'morning' || when === 'day') return part === 'morning' || part === 'afternoon';
  if (when === 'night') return part === 'evening' || part === 'night';
  return true;
}

/** What to do instead of a plan day that does not suit the moment. It still counts as that day. */
const INSTEAD = { morning: 'wakeup', afternoon: 'neck', evening: 'gravitybasics', night: 'winddown' };

export function planForNow(routineId, when, part) {
  return fitsNow(when, part) ? routineId : INSTEAD[part];
}

const EXTRA = { morning: 'desk', afternoon: 'neck', evening: 'gravity', night: 'gravity' };

/**
 * Other options under the main card: the planned routine when the main card
 * replaced it, then always a way to wake up and a way to wind down, and a
 * three-minute breather.
 * @returns {{id: string, plan?: boolean}[]}
 */
export function alternatives(mainId, part, plannedId = null) {
  const out = [];
  const add = (id, extra = {}) => {
    if (id && id !== mainId && !out.some((x) => x.id === id)) out.push({ id, ...extra });
  };
  if (plannedId) add(plannedId, { plan: true });
  add('wakeup');
  add('winddown');
  add('breathe');
  add(EXTRA[part]);
  return out.slice(0, 3);
}
