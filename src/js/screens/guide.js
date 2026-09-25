// The beginner guide: what this is, the three rules, blocks, your plan, safety.

import { html } from '../ui/dom.js';
import { GUIDE } from '../data/guide.js';
import { topBar } from './common.js';
import { t } from '../i18n.js';

export function render(app, route) {
  const first = GUIDE.find((g) => g.id === route.arg) || GUIDE[0];
  const ordered = [first, ...GUIDE.filter((g) => g !== first)];
  return html`${topBar(t('guide.title'))}
    ${ordered.map(
      (g, i) => html`<section class="section prose" id="g-${g.id}">
        ${i === 0 ? html`<h1 class="display" tabindex="-1">${g.title}</h1>` : html`<h2 class="section-title">${g.title}</h2>`}
        ${(g.body || []).map((p) => html`<p>${p}</p>`)}
        ${g.list ? html`<div class="stack">${g.list.map(([head, text]) => html`<div class="ease"><h3>${head}</h3><p>${text}</p></div>`)}</div>` : ''}
        ${g.after ? html`<p class="muted">${g.after}</p>` : ''}
      </section>`,
    )}`;
}
