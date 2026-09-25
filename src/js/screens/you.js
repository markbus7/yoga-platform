// You: profile, session settings, the beginner guide and your data.

import { html, raw, esc, ask, toast, sheet } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { CARE_AREAS } from '../data/areas.js';
import { GUIDE } from '../data/guide.js';
import { VIDEOS, LEARN_LINKS } from '../data/videos.js';
import { HOLD_LENGTHS } from '../lib/session.js';
import { voicesFor, speechAvailable, speak, unlockAudio, chime } from '../lib/audio.js';
import { defaultState } from '../lib/store.js';
import { EXERCISE } from '../data/exercises.js';
import { t, lang, list, LANGS } from '../i18n.js';

const GOALS = [5, 10, 15, 20, 30];
const WHEN = [
  ['morning', 'you.whenMorning'],
  ['evening', 'you.whenEvening'],
  ['both', 'you.whenBoth'],
];
const TRANSITIONS = [
  [5, 'you.quick'],
  [8, 'you.normal'],
  [12, 'you.relaxed'],
];
const RATES = [
  [0.85, 'you.slower'],
  [1, 'you.normal'],
  [1.15, 'you.faster'],
];

const sw = (act, on, label) => html`<button class="switch" role="switch" data-act="${act}" aria-checked="${on}" aria-label="${label}"></button>`;

function voiceBlock(settings) {
  if (!settings.voice || !speechAvailable()) return '';
  const l = lang();
  const voices = voicesFor(l);
  const chosen = settings.voices[l] || '';
  const picker = voices.length
    ? html`<label for="f-voice">${t('you.voicePick')}</label><select id="f-voice" class="input" data-field="voice"><option value="">${t('you.voiceAuto')}</option>${voices.map((v) => html`<option value="${v.voiceURI}" ${v.voiceURI === chosen ? raw('selected') : ''}>${v.name} (${v.lang})</option>`)}</select>`
    : html`<p class="hint">${t('you.noVoiceLang')}</p>`;
  return html`<div class="field" style="padding-bottom:14px">${picker}
    <div class="row wrap"><div class="seg" role="group" aria-label="${t('you.voiceSpeed')}" style="flex:1">${RATES.map(([v, k]) => html`<button data-act="rate" data-v="${v}" aria-pressed="${settings.rate === v}">${t(k)}</button>`)}</div><button class="btn btn-small btn-ghost" data-act="test-voice">${raw(icon('volume'))} ${t('you.test')}</button></div></div>`;
}

function credits() {
  const teachers = [...new Set(VIDEOS.map((v) => v.teacher).filter(Boolean))];
  const learn = LEARN_LINKS.map((l) => {
    const link = `<a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.title)}</a>`;
    return esc(t('you.learn', { name: l.by })).replace('{title}', link);
  }).join(' ');
  return html`<p>${t('you.credits', { teachers: list(teachers) })} ${raw(learn)}</p>`;
}

export function render(app) {
  const { profile, settings } = app.store.state;
  const where = app.store.status.where;
  const cur = lang();
  return html`
    <header class="stack" style="--gap:6px"><h1 class="display" tabindex="-1">${t('you.title')}</h1><p class="lede">${t('you.lede')}</p></header>

    <section class="section">
      <div class="card stack" style="--gap:10px">
        <div class="field"><span class="label" id="lang-l">${t('you.lang')} <span class="muted" lang="${cur === 'nl' ? 'en' : 'nl'}">· ${cur === 'nl' ? 'Language' : 'Taal'}</span></span><span class="hint">${t('you.langHint')}</span>
          <div class="seg" role="group" aria-labelledby="lang-l">${LANGS.map((l) => html`<button data-act="lang" data-v="${l}" lang="${l}" aria-pressed="${cur === l}">${t('lang.' + l)}</button>`)}</div></div>
      </div>
    </section>

    <section class="section">
      <h2 class="section-title">${t('you.about')}</h2>
      <div class="card stack" style="--gap:16px">
        <div class="field"><label for="f-name">${t('you.name')} <span class="muted">${t('you.optional')}</span></label><input id="f-name" class="input" value="${profile.name}" maxlength="40" autocomplete="given-name" data-field="name" placeholder="${t('you.namePh')}"></div>
        <div class="field"><span class="label">${t('you.goal')}</span><div class="seg" role="group" aria-label="${t('you.goal')}">${GOALS.map((g) => html`<button data-act="goal" data-v="${g}" aria-pressed="${profile.goal === g}">${t('common.min', { n: g })}</button>`)}</div></div>
        <div class="field"><span class="label">${t('you.when')}</span><div class="seg" role="group" aria-label="${t('you.whenAria')}">${WHEN.map(([v, k]) => html`<button data-act="when" data-v="${v}" aria-pressed="${profile.when === v}">${t(k)}</button>`)}</div></div>
        <div class="field"><span class="label">${t('you.care')}</span><span class="hint">${t('you.careHint')}</span>
          <div class="chips">${CARE_AREAS.map((c) => html`<button class="chip" data-act="care" data-v="${c.id}" aria-pressed="${profile.care.includes(c.id)}">${c.name}</button>`)}</div></div>
      </div>
    </section>

    <section class="section">
      <h2 class="section-title">${t('you.session')}</h2>
      <div class="card" style="padding-block:4px">
        <div class="switch-row"><div><div class="t">${t('you.hold')}</div><div class="d">${HOLD_LENGTHS.find((h) => h.id === settings.hold)?.about || ''}</div></div></div>
        <div class="seg" role="group" aria-label="${t('you.hold')}" style="margin-bottom:12px">${HOLD_LENGTHS.map((h) => html`<button data-act="hold" data-v="${h.id}" aria-pressed="${settings.hold === h.id}">${h.name}</button>`)}</div>
        <div class="switch-row"><div><div class="t">${t('you.voice')}</div><div class="d">${speechAvailable() ? t('you.voiceOn') : t('you.voiceNone')}</div></div>${sw('voice', settings.voice, t('you.voice'))}</div>
        ${voiceBlock(settings)}
        <div class="switch-row"><div><div class="t">${t('you.chimes')}</div><div class="d">${t('you.chimesText')}</div></div>${sw('chime', settings.chime, t('you.chimes'))}</div>
        <div class="switch-row"><div><div class="t">${t('you.checkins')}</div><div class="d">${t('you.checkinsText')}</div></div>${sw('checkins', settings.checkins, t('you.checkins'))}</div>
        <div class="switch-row" style="display:block"><div class="t" style="margin-bottom:8px">${t('you.transition')}</div><div class="seg" role="group" aria-label="${t('you.transition')}">${TRANSITIONS.map(([v, k]) => html`<button data-act="transition" data-v="${v}" aria-pressed="${settings.transition === v}">${t(k)} · ${v}s</button>`)}</div></div>
      </div>
    </section>

    <section class="section">
      <h2 class="section-title">${t('you.guide')}</h2>
      <div class="card" style="padding-block:4px"><div class="list">${GUIDE.map((g) => html`<button class="list-row" data-go="guide:${g.id}"><span class="grow"><span class="t" style="display:block">${g.title}</span></span>${raw(icon('chev', 'chev'))}</button>`)}</div></div>
    </section>

    <section class="section">
      <h2 class="section-title">${t('you.data')}</h2>
      <div class="card stack">
        <p>${where === 'cloud' ? html`${raw(icon('check'))} ${t('you.dataCloud')}` : t('you.dataLocal')}</p>
        <div class="row wrap"><button class="btn btn-small btn-ghost" data-act="export">${raw(icon('copy'))} ${t('you.copy')}</button><button class="btn btn-small btn-ghost" data-act="import">${raw(icon('upload'))} ${t('you.restore')}</button><button class="btn btn-small btn-ghost" data-act="reset">${raw(icon('trash'))} ${t('you.reset')}</button></div>
      </div>
    </section>

    <section class="section">
      <h2 class="section-title">${t('you.aboutTitle')}</h2>
      <div class="prose stack muted small">
        <p>${t('you.disclaimer')}</p>
        ${credits()}
        <p>${t('you.scale')}</p>
      </div>
    </section>`;
}

function set(app, fn) {
  app.store.update(fn);
}

export const actions = {
  goal(app, el) {
    set(app, (s) => {
      s.profile.goal = +el.dataset.v;
    });
  },
  when(app, el) {
    set(app, (s) => {
      s.profile.when = el.dataset.v;
    });
  },
  care(app, el) {
    const v = el.dataset.v;
    set(app, (s) => {
      s.profile.care = s.profile.care.includes(v) ? s.profile.care.filter((x) => x !== v) : [...s.profile.care, v];
    });
  },
  hold(app, el) {
    set(app, (s) => {
      s.settings.hold = +el.dataset.v;
    });
  },
  voice(app) {
    set(app, (s) => {
      s.settings.voice = !s.settings.voice;
    });
  },
  chime(app) {
    set(app, (s) => {
      s.settings.chime = !s.settings.chime;
    });
    if (app.store.state.settings.chime) {
      unlockAudio();
      chime('start', app.store.state.settings.volume);
    }
  },
  checkins(app) {
    set(app, (s) => {
      s.settings.checkins = !s.settings.checkins;
    });
  },
  transition(app, el) {
    set(app, (s) => {
      s.settings.transition = +el.dataset.v;
    });
  },
  rate(app, el) {
    set(app, (s) => {
      s.settings.rate = +el.dataset.v;
    });
  },
  'test-voice'(app) {
    unlockAudio();
    const s = app.store.state.settings;
    speak(EXERCISE.child.say, { voiceURI: s.voices[lang()], rate: s.rate, lang: lang() });
  },
  async export(app) {
    const json = app.store.exportJSON();
    let copied = false;
    try {
      await navigator.clipboard.writeText(json);
      copied = true;
    } catch {
      copied = false;
    }
    await sheet(
      () => `<h2>${esc(copied ? t('backup.copied') : t('backup.title'))}</h2>
        <p class="muted">${esc(copied ? t('backup.copiedText') : t('backup.selectText'))}</p>
        <label class="sr" for="bk">${esc(t('backup.label'))}</label><textarea id="bk" class="input" readonly style="min-height:180px;font-family:ui-monospace,monospace;font-size:12px">${esc(json)}</textarea>
        <button class="btn" data-a="ok">${esc(t('backup.done'))}</button>`,
      (box, close) => {
        const ta = box.querySelector('#bk');
        ta.addEventListener('focus', () => ta.select());
        box.querySelector('[data-a="ok"]').onclick = () => close();
      },
    );
  },
  async import(app) {
    const text = await sheet(
      () => `<h2>${esc(t('restore.title'))}</h2>
        <p class="muted">${esc(t('restore.text'))}</p>
        <label class="sr" for="imp">${esc(t('backup.label'))}</label><textarea id="imp" class="input" style="min-height:140px;font-family:ui-monospace,monospace;font-size:12px" placeholder='{"app":"unstuck", ...}'></textarea>
        <input id="imp-file" type="file" accept="application/json,.json,.txt">
        <p class="small" id="imp-err" style="color:var(--glow-text)" hidden></p>
        <div class="row wrap"><button class="btn" data-a="ok">${esc(t('restore.go'))}</button><button class="btn btn-ghost" data-a="no">${esc(t('common.cancel'))}</button></div>`,
      (box, close) => {
        const ta = box.querySelector('#imp');
        box.querySelector('#imp-file').addEventListener('change', (e) => {
          const file = e.target.files && e.target.files[0];
          if (!file) return;
          const r = new FileReader();
          r.onload = () => {
            ta.value = String(r.result || '');
          };
          r.readAsText(file);
        });
        box.querySelector('[data-a="ok"]').onclick = () => {
          try {
            const data = JSON.parse(ta.value);
            if (!data || typeof data !== 'object' || !Array.isArray(data.sessions)) throw new Error('bad');
            close(data);
          } catch {
            const err = box.querySelector('#imp-err');
            err.hidden = false;
            err.textContent = t('restore.bad');
          }
        };
        box.querySelector('[data-a="no"]').onclick = () => close(null);
      },
    );
    if (!text) return;
    app.store.replace(text);
    toast(t('restore.done'));
  },
  async reset(app) {
    const ok = await ask(t('reset.q'), t('reset.body'), t('reset.yes'), t('common.cancel'));
    if (!ok) return;
    const fresh = defaultState();
    fresh.settings.lang = app.store.state.settings.lang;
    app.store.replace(fresh);
    toast(t('reset.done'));
  },
};

/** Text fields save as you type (debounced by the app). */
export const fields = {
  name(app, value) {
    app.store.update((s) => {
      s.profile.name = value.slice(0, 40);
    });
  },
  voice(app, value) {
    const l = lang();
    app.store.update((s) => {
      s.settings.voices = { ...s.settings.voices, [l]: value };
    });
  },
};
