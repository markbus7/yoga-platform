// App shell: navigation, rendering and the actions shared across screens.

import * as today from './screens/today.js';
import * as explore from './screens/explore.js';
import * as progress from './screens/progress.js';
import * as you from './screens/you.js';
import * as exercise from './screens/exercise.js';
import * as routine from './screens/routine.js';
import * as build from './screens/build.js';
import * as check from './screens/check.js';
import * as plan from './screens/plan.js';
import * as guide from './screens/guide.js';
import { icon } from './ui/icons.js';
import { installTooltips } from './ui/charts.js';
import { toast } from './ui/dom.js';
import { startSession } from './player.js';
import { ROUTINE } from './data/routines.js';
import { EXERCISE } from './data/exercises.js';
import { AREA_NAME } from './data/areas.js';
import { routineItems } from './lib/session.js';
import { streak } from './lib/stats.js';
import { dayKey } from './lib/dates.js';
import { onVoicesChanged } from './lib/audio.js';
import { holdScale } from './screens/common.js';
import { t, lang, setLang, detectLang, inline } from './i18n.js';

const SCREENS = { today, explore, progress, you, exercise, routine, build, check, plan, guide };
const TABS = ['today', 'explore', 'progress', 'you'];
const TAB_OF = { today: 'today', explore: 'explore', progress: 'progress', you: 'you', exercise: 'explore', routine: 'explore', build: 'today', check: 'progress', plan: 'today', guide: 'you' };
const KIND_COLOR = { hold: 'teal', flow: 'sunrise', breath: 'sky' };

function parse(str, extra = {}) {
  const i = str.indexOf(':');
  const route = i < 0 ? { name: str } : { name: str.slice(0, i), arg: str.slice(i + 1) };
  if (extra.day) route.day = extra.day;
  return SCREENS[route.name] ? route : { name: 'today' };
}

export function createApp(root, store) {
  const app = {
    store,
    route: { name: 'today' },
    stack: [],
    player: null,
    ui: {
      stuck: new Set(),
      explore: { tab: 'routines', area: 'all', kind: 'all' },
      build: { minutes: 10, style: 'mix', place: 'mat', seed: 1 },
      check: null,
      historyAll: false,
    },
    exercise: (id) => EXERCISE[id],
  };

  root.innerHTML = `<div class="app">
    <nav class="tabs">
      <span class="brand"><span class="wordmark">unstuck</span></span>
      ${TABS.map((id) => `<button class="tab" data-tab="${id}"><span class="tab-icon">${icon(id)}</span><span class="tab-label"></span></button>`).join('')}
    </nav>
    <main class="view" id="view" tabindex="-1"></main>
  </div>`;
  const view = root.querySelector('#view');
  const nav = root.querySelector('.tabs');
  const tabs = [...root.querySelectorAll('[data-tab]')];

  /** Follow the language setting (or the browser's language until one is picked). */
  let shown = null;
  const syncLang = () => {
    const want = store.state.settings.lang || detectLang();
    if (want !== lang() || shown === null) setLang(want);
    if (shown === lang()) return;
    shown = lang();
    nav.setAttribute('aria-label', t('nav.main'));
    tabs.forEach((el) => {
      el.querySelector('.tab-label').textContent = t('tab.' + el.dataset.tab);
    });
  };

  let quiet = false;

  app.render = ({ keepScroll = false, focus = false } = {}) => {
    syncLang();
    const scr = SCREENS[app.route.name] || today;
    const y = window.scrollY;
    view.innerHTML = String(scr.render(app, app.route));
    if (scr.mount) scr.mount(app, view, app.route);
    const tab = TAB_OF[app.route.name];
    tabs.forEach((el) => {
      if (el.dataset.tab === tab) el.setAttribute('aria-current', 'page');
      else el.removeAttribute('aria-current');
    });
    if (keepScroll) window.scrollTo(0, y);
    if (focus) {
      const h = view.querySelector('h1');
      if (h) h.focus({ preventScroll: true });
    }
  };

  app.go = (to, { replace = false, day, tab = false } = {}) => {
    const route = typeof to === 'string' ? parse(to, { day }) : to;
    if (tab || TAB_OF[route.name] === route.name) app.stack = [];
    else if (!replace) app.stack.push({ route: app.route, y: window.scrollY });
    app.route = route;
    app.render({ focus: true });
    window.scrollTo(0, 0);
  };

  app.back = () => {
    const prev = app.stack.pop();
    if (!prev) return app.go(TAB_OF[app.route.name] || 'today', { tab: true });
    app.route = prev.route;
    app.render({ focus: true });
    window.scrollTo(0, prev.y);
  };

  /** Run a store update without re-rendering (text fields keep focus). */
  app.quietly = (fn) => {
    quiet = true;
    try {
      fn();
    } finally {
      quiet = false;
    }
  };

  app.startRoutine = (id, day) => {
    const r = ROUTINE[id];
    if (!r) return;
    startSession(app, {
      title: day ? t('session.day', { day, name: r.name }) : r.name,
      color: r.color,
      items: routineItems(r),
      source: day ? 'program' : 'routine',
      routineId: r.id,
      programDay: day || null,
      scale: holdScale(app, day),
      stuck: [...app.ui.stuck],
    });
  };

  app.afterSession = (session, countedForPlan) => {
    const st = streak(app.store.state.sessions, dayKey());
    const streakText = st.days > 1 ? ' ' + t('toast.streak', { n: st.days }) : '';
    toast((countedForPlan ? t('toast.dayDone', { day: session.programDay }) : t('toast.saved')) + streakText);
    if (app.route.name !== 'progress') app.go('today', { tab: true });
  };

  const GLOBAL = {
    back: () => app.back(),
    lang: (a, el) => {
      const v = el.dataset.v;
      if (v === lang() && app.store.state.settings.lang === v) return;
      app.store.update((s) => {
        s.settings.lang = v;
      });
    },
    'start-routine': (a, el) => app.startRoutine(el.dataset.id, el.dataset.day ? +el.dataset.day : null),
    'start-exercise': (a, el) => {
      const ex = EXERCISE[el.dataset.id];
      startSession(app, { title: ex.name, color: KIND_COLOR[ex.kind], items: [{ id: ex.id, sec: ex.sec }], source: 'single', exId: ex.id });
    },
    'start-custom': () => {
      const items = build.items(app);
      const focus = [...app.ui.stuck].slice(0, 2);
      startSession(app, {
        title: focus.length ? t('session.customFocus', { areas: focus.map((a) => inline(AREA_NAME[a])).join(t('list.and')) }) : t('session.custom'),
        color: 'clay',
        items,
        source: 'custom',
        focus,
        stuck: [...app.ui.stuck],
      });
    },
  };

  root.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('[data-tab]');
    if (tabBtn) {
      app.go(tabBtn.dataset.tab, { tab: true });
      return;
    }
    const el = e.target.closest('[data-act], [data-go], [data-area]');
    if (!el || !view.contains(el) || el.hasAttribute('disabled')) return;
    if (el.dataset.go) {
      e.preventDefault();
      app.go(el.dataset.go, { day: el.dataset.day ? +el.dataset.day : undefined });
      return;
    }
    const act = el.dataset.act || (el.dataset.area ? 'area' : null);
    const scr = SCREENS[app.route.name];
    if (GLOBAL[act]) GLOBAL[act](app, el, e);
    else if (scr.actions && scr.actions[act]) scr.actions[act](app, el, e);
  });

  root.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[role="button"]:not(button)')) {
      e.preventDefault();
      e.target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }
  });

  let fieldTimer = 0;
  const onField = (e) => {
    const f = e.target.closest && e.target.closest('[data-field]');
    if (!f) return;
    const scr = SCREENS[app.route.name];
    const handler = scr.fields && scr.fields[f.dataset.field];
    if (!handler) return;
    clearTimeout(fieldTimer);
    const run = () => app.quietly(() => handler(app, f.value));
    if (e.type === 'change') run();
    else fieldTimer = setTimeout(run, 500);
  };
  root.addEventListener('input', onField);
  root.addEventListener('change', onField);

  store.subscribe(() => {
    if (!quiet) app.render({ keepScroll: true });
  });
  onVoicesChanged(() => {
    if (app.route.name === 'you') app.render({ keepScroll: true });
  });
  installTooltips(document);

  const hash = (location.hash || '').replace('#', '');
  app.route = SCREENS[hash] ? { name: hash } : { name: 'today' };
  app.render();
  return app;
}
