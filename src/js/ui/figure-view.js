// Mounts an animated exercise figure into the page. All playing figures
// share one requestAnimationFrame loop and pause while scrolled out of view.

import { prepareFigure, poseAt, shapesFor, figureSVG, cropBox, VIEW_W, VIEW_H } from '../figure/rig.js';
import { reducedMotion } from './dom.js';

const NS = 'http://www.w3.org/2000/svg';
const live = new Set();
let raf = 0;
const cache = new Map();

function prepared(spec) {
  let fig = cache.get(spec);
  if (!fig) {
    fig = prepareFigure(spec);
    cache.set(spec, fig);
  }
  return fig;
}

const io = typeof IntersectionObserver === 'function'
  ? new IntersectionObserver((entries) => {
      for (const e of entries) {
        const v = e.target.__fig;
        if (v) v.visible = e.isIntersecting;
      }
    })
  : null;

function loop(now) {
  raf = 0;
  for (const v of live) {
    if (!v.host.isConnected) {
      live.delete(v);
      if (io) io.unobserve(v.host);
      continue;
    }
    if (v.visible && v.playing) draw(v, (now - v.t0) / 1000);
  }
  if (live.size) raf = requestAnimationFrame(loop);
}

function kick() {
  if (!raf && live.size) raf = requestAnimationFrame(loop);
}

function draw(v, t) {
  const pose = poseAt(v.fig, t, v.mode, v.enterSec);
  const shapes = shapesFor(v.fig, pose, v.glow);
  let order = '';
  for (const s of shapes) {
    let el = v.els.get(s.key);
    if (!el) {
      el = document.createElementNS(NS, s.tag);
      el.setAttribute('class', s.cls);
      v.els.set(s.key, el);
    }
    for (const k in s.attrs) el.setAttribute(k, s.attrs[k]);
    order += s.key + '|';
  }
  if (order !== v.order) {
    // Glow shapes live in one group so overlapping parts do not look darker.
    if (!v.glowG) {
      v.glowG = document.createElementNS(NS, 'g');
      v.glowG.setAttribute('class', 'fg-glow-g');
    }
    for (const s of shapes) (s.glow ? v.glowG : v.g).appendChild(v.els.get(s.key));
    v.g.appendChild(v.glowG);
    v.order = order;
  }
}

/**
 * @param {HTMLElement} host
 * @param {object} spec  figure spec from poses.js
 * @param {object} opts  mode: 'preview' | 'enter' | 'hold' | 'still'; mirror; glow; label
 */
export function mountFigure(host, spec, opts = {}) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'fig');
  if (opts.label) {
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', opts.label);
  } else {
    svg.setAttribute('aria-hidden', 'true');
  }
  const g = document.createElementNS(NS, 'g');
  svg.appendChild(g);
  host.replaceChildren(svg);
  const v = {
    host,
    svg,
    g,
    els: new Map(),
    order: '',
    fig: prepared(spec),
    spec,
    mode: opts.mode || 'preview',
    enterSec: opts.enterSec || 3,
    glow: opts.glow === false ? [] : spec.glow || [],
    t0: performance.now(),
    visible: true,
    playing: opts.mode !== 'still' && !reducedMotion(),
  };
  v.crop = opts.crop !== false;
  host.__fig = v;
  setBox(v);
  setMirror(v, !!opts.mirror);
  draw(v, 0);
  if (!v.playing && opts.mode !== 'still') draw(v, 0);
  live.add(v);
  if (io) io.observe(host);
  kick();

  return {
    setMode(mode, { enterSec, restart = true } = {}) {
      v.mode = mode;
      if (enterSec) v.enterSec = enterSec;
      if (restart) v.t0 = performance.now();
      v.playing = mode !== 'still' && !reducedMotion();
      if (!v.playing) draw(v, 0);
      kick();
    },
    setMirror(on) {
      setMirror(v, on);
    },
    setSpec(next, { mode, mirror, enterSec } = {}) {
      v.spec = next;
      v.fig = prepared(next);
      v.glow = next.glow || [];
      v.els.clear();
      v.g.replaceChildren();
      v.glowG = null;
      v.order = '';
      setBox(v);
      if (mode) v.mode = mode;
      if (enterSec) v.enterSec = enterSec;
      v.t0 = performance.now();
      v.playing = v.mode !== 'still' && !reducedMotion();
      setMirror(v, !!mirror);
      draw(v, 0);
      kick();
    },
    pause() {
      v.playing = false;
      v.pausedAt = performance.now();
    },
    play() {
      if (reducedMotion() || v.mode === 'still') return;
      if (v.pausedAt) v.t0 += performance.now() - v.pausedAt;
      v.pausedAt = 0;
      v.playing = true;
      kick();
    },
    get playing() {
      return v.playing;
    },
  };
}

function setBox(v) {
  if (v.crop) {
    v.svg.setAttribute('viewBox', cropBox(v.fig));
    v.svg.setAttribute('preserveAspectRatio', 'xMidYMax meet');
  } else {
    v.svg.setAttribute('viewBox', `0 0 ${VIEW_W} ${VIEW_H}`);
    v.svg.removeAttribute('preserveAspectRatio');
  }
}

function setMirror(v, on) {
  if (on) v.g.setAttribute('transform', `translate(${VIEW_W} 0) scale(-1 1)`);
  else v.g.removeAttribute('transform');
}

/** Static thumbnail markup (cheap; used in lists). */
const thumbCache = new Map();
export function figureThumb(spec, { glow = true } = {}) {
  let hit = thumbCache.get(spec);
  if (!hit) thumbCache.set(spec, (hit = {}));
  const k = glow ? 'g' : 'n';
  if (!hit[k]) hit[k] = figureSVG(spec, { glow, mode: 'still', crop: true });
  return hit[k];
}
