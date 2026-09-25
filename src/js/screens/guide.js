// The beginner guide: what this is, the three rules, blocks, your plan, safety.

import { html } from '../ui/dom.js';
import { GUIDE } from '../data/guide.js';
import { topBar } from './common.js';

export function render(app, route) {
  const first = GUIDE.find((g) => g.id === route.arg) || GUIDE[0];
  const ordered = [first, ...GUIDE.filter((g) => g !== first)];
  return html`${topBar('Guide')}
    ${ordered.map(
      (g, i) => html`<section class="section prose" id="g-${g.id}">
        ${i === 0 ? html`<h1 class="display" tabindex="-1">${g.title}</h1>` : html`<h2 class="section-title">${g.title}</h2>`}
        ${(g.body || []).map((p) => html`<p>${p}</p>`)}
        ${g.list ? html`<div class="stack">${g.list.map(([t, d]) => html`<div class="ease"><h3>${t}</h3><p>${d}</p></div>`)}</div>` : ''}
        ${g.after ? html`<p class="muted">${g.after}</p>` : ''}
      </section>`,
    )}`;
}
