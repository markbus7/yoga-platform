// Front and back body outlines with tappable areas ("where do you feel stuck?").
// Built from the same rig as the exercise figures.

import { solvePose, capsulePath, circlePath, HEAD_R } from '../figure/rig.js';
import { AREA_NAME } from '../data/areas.js';
import { t } from '../i18n.js';

const POSE = { view: 'front', uarmL: 108, farmL: 100, handL: 98, uarmR: 72, farmR: 80, handR: 82, thighL: 94, thighR: 86 };

const f = (n) => Math.round(n * 10) / 10;
const cap = (a, b, r) => capsulePath(a, b, r, r);
const mid = (a, b, t = 0.5) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const shift = (p, dx, dy) => [p[0] + dx, p[1] + dy];

let cached = null;
function geometry() {
  if (cached) return cached;
  const sol = solvePose(POSE);
  const P = sol.pts;
  const body = [];
  for (const s of sol.segs) body.push(`<path class="bm-body" d="${capsulePath(s.a, s.b, s.r0, s.r1)}"/>`);
  const torso = 'M' + sol.torso.poly.map((q) => `${f(q[0])} ${f(q[1])}`).join('L') + 'Z';
  body.push(`<path class="bm-body torso" stroke-width="12" d="${torso}"/>`);
  const head = circlePath(P.headC, HEAD_R);

  const chestL = shift(P.shoulderL, 5, 12);
  const chestR = shift(P.shoulderR, -5, 12);
  const waistL = shift(P.waist, -9, 0);
  const waistR = shift(P.waist, 9, 0);
  const front = [
    ['hips', cap(shift(P.hipL, -2, 4), shift(P.hipR, 2, 4), 9)],
    ['quads', cap(mid(P.hipL, P.kneeL, 0.2), P.kneeL, 7) + cap(mid(P.hipR, P.kneeR, 0.2), P.kneeR, 7)],
    ['calves', cap(P.kneeL, P.ankleL, 5.2) + cap(P.kneeR, P.ankleR, 5.2)],
    ['sides', cap(shift(waistL, -2, 0), shift(chestL, -6, 0), 4.5) + cap(shift(waistR, 2, 0), shift(chestR, 6, 0), 4.5)],
    ['chest', cap(chestL, chestR, 8.5)],
    ['arms', cap(P.elbowL, P.tipL, 5) + cap(P.elbowR, P.tipR, 5)],
    ['shoulders', circlePath(P.shoulderL, 7.5) + circlePath(P.shoulderR, 7.5)],
    ['neck', cap(P.neckBase, P.neckTop, 6)],
  ];
  const back = [
    ['glutes', cap(shift(P.hipL, -1, 5), shift(P.hipR, 1, 5), 10.5)],
    ['hamstrings', cap(mid(P.hipL, P.kneeL, 0.3), P.kneeL, 7) + cap(mid(P.hipR, P.kneeR, 0.3), P.kneeR, 7)],
    ['calves', cap(P.kneeL, P.ankleL, 5.2) + cap(P.kneeR, P.ankleR, 5.2)],
    ['lowerBack', cap(waistL, waistR, 8)],
    ['upperBack', cap(chestL, chestR, 9)],
    ['shoulders', circlePath(P.shoulderL, 7.5) + circlePath(P.shoulderR, 7.5)],
    ['neck', cap(P.neckBase, P.neckTop, 6)],
  ];

  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const s of sol.segs) {
    for (const [pt, r] of [[s.a, s.r0], [s.b, s.r1]]) {
      x0 = Math.min(x0, pt[0] - r);
      x1 = Math.max(x1, pt[0] + r);
      y0 = Math.min(y0, pt[1] - r);
      y1 = Math.max(y1, pt[1] + r);
    }
  }
  y0 = Math.min(y0, P.headC[1] - HEAD_R);
  const pad = 4;
  const viewBox = `${f(x0 - pad)} ${f(y0 - pad)} ${f(x1 - x0 + pad * 2)} ${f(y1 - y0 + pad * 2)}`;
  cached = { body: body.join(''), head, headC: P.headC, front, back, viewBox };
  return cached;
}

function hair(side, g) {
  if (side === 'back') return `<path class="bm-hair" d="${circlePath(g.headC, HEAD_R + 0.4)}"/>`;
  const c = g.headC;
  const R = HEAD_R + 0.4;
  const a1 = (-166 * Math.PI) / 180;
  const a2 = (-14 * Math.PI) / 180;
  const A = [c[0] + R * Math.cos(a1), c[1] + R * Math.sin(a1)];
  const B = [c[0] + R * Math.cos(a2), c[1] + R * Math.sin(a2)];
  return `<path class="bm-hair" d="M${f(A[0])} ${f(A[1])}A${R} ${R} 0 0 1 ${f(B[0])} ${f(B[1])}Q${f(c[0])} ${f(c[1] - 2)} ${f(A[0])} ${f(A[1])}Z"/>`;
}

function view(side, selected) {
  const g = geometry();
  const regions = side === 'front' ? g.front : g.back;
  const hits = regions
    .map(([area, d]) => {
      const on = selected.has(area);
      return `<path class="bm-hit${on ? ' on' : ''}" d="${d}" data-area="${area}" role="button" tabindex="0" aria-pressed="${on}" aria-label="${AREA_NAME[area]}"><title>${AREA_NAME[area]}</title></path>`;
    })
    .join('');
  return `<figure><svg viewBox="${g.viewBox}" aria-label="${t(side === 'front' ? 'bm.frontAria' : 'bm.backAria')}">${g.body}<path class="bm-body" d="${g.head}"/>${hair(side, g)}${hits}</svg><figcaption>${t(side === 'front' ? 'bm.front' : 'bm.back')}</figcaption></figure>`;
}

/** Markup for the two-view map. Clicks bubble from elements with [data-area]. */
export function bodyMap(selected = new Set()) {
  return `<div class="bodymap">${view('front', selected)}${view('back', selected)}</div>`;
}
