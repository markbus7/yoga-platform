// A small switch between an exercise's camera angles (side, front, from above).

import { viewKinds } from '../data/exercises.js';
import { esc } from './dom.js';
import { t } from '../i18n.js';

/**
 * @param ex       the exercise
 * @param current  index of the view on screen
 * @param attr     the click attribute the screen listens for ('data-act' or 'data-p')
 * @returns markup, or '' when the exercise has one view
 */
export function viewPick(ex, current, attr = 'data-act') {
  if (!ex.views || ex.views.length < 2) return '';
  const btns = viewKinds(ex).map((k, i) => `<button type="button" ${attr}="view" data-v="${i}" aria-pressed="${i === current}">${esc(t('view.' + k))}</button>`);
  return `<div class="view-pick" role="group" aria-label="${esc(t('view.label'))}">${btns.join('')}</div>`;
}

/** The chosen view for an exercise, remembered for this visit. */
export function viewOf(app, ex) {
  return Math.min(app.ui.views[ex.id] || 0, ex.views.length - 1);
}
