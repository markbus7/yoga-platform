// Tiny helpers for building HTML strings safely and wiring events.

class Raw {
  constructor(s) {
    this.s = s;
  }
  toString() {
    return this.s;
  }
}

/** Mark a string as trusted markup. */
export const raw = (s) => new Raw(String(s));

export function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function fmt(v) {
  if (v == null) return '';
  if (typeof v === 'boolean') return String(v);
  if (v instanceof Raw) return v.s;
  if (Array.isArray(v)) return v.map(fmt).join('');
  return esc(v);
}

/** Tagged template: interpolations are escaped unless wrapped with raw() or produced by html``. */
export function html(strings, ...vals) {
  let out = '';
  strings.forEach((str, i) => {
    out += str;
    if (i < vals.length) out += fmt(vals[i]);
  });
  return new Raw(out);
}

export const qs = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Plural helper: n('day', 3) -> "3 days" */
export function n(word, count, plural = word + 's') {
  return `${count} ${count === 1 ? word : plural}`;
}

let toastTimer = 0;
export function toast(message) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.hidden = false;
  el.textContent = message;
  el.style.animation = 'none';
  void el.offsetWidth;
  el.style.animation = '';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.hidden = true;
  }, 2600);
}

/**
 * A bottom sheet. `render(close)` returns markup; `wire(el, close)` attaches
 * behaviour. Resolves with whatever value `close(value)` is called with.
 */
export function sheet(render, wire) {
  return new Promise((resolve) => {
    const back = document.createElement('div');
    back.className = 'sheet-back';
    const prevFocus = document.activeElement;
    const close = (value) => {
      back.remove();
      document.removeEventListener('keydown', onKey);
      if (prevFocus && prevFocus.focus) prevFocus.focus();
      resolve(value);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') close(undefined);
    };
    back.innerHTML = `<div class="sheet" role="dialog" aria-modal="true">${render(close)}</div>`;
    back.addEventListener('click', (e) => {
      if (e.target === back) close(undefined);
    });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(back);
    const box = back.firstElementChild;
    if (wire) wire(box, close);
    const first = box.querySelector('[autofocus], button, input, textarea, select');
    if (first) first.focus({ preventScroll: true });
  });
}

/** An in-page yes/no question (the viewer does not show confirm()). */
export function ask(title, body, yes = 'Yes', no = 'Cancel') {
  return sheet(
    () => `<h2>${esc(title)}</h2><p class="muted">${esc(body)}</p>
      <div class="row wrap"><button class="btn" data-a="yes">${esc(yes)}</button><button class="btn btn-ghost" data-a="no">${esc(no)}</button></div>`,
    (el, close) => {
      el.querySelector('[data-a="yes"]').onclick = () => close(true);
      el.querySelector('[data-a="no"]').onclick = () => close(false);
    },
  );
}

export const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
