// You: profile, session settings, the beginner guide and your data.

import { html, raw, esc, ask, toast, sheet } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { CARE_AREAS } from '../data/areas.js';
import { GUIDE } from '../data/guide.js';
import { VIDEOS, LEARN_LINKS } from '../data/videos.js';
import { HOLD_LENGTHS } from '../lib/session.js';
import { englishVoices, speechAvailable, speak, unlockAudio, chime } from '../lib/audio.js';
import { defaultState } from '../lib/store.js';

const GOALS = [5, 10, 15, 20, 30];
const WHEN = [
  ['morning', 'Morning'],
  ['evening', 'Evening'],
  ['both', 'Both'],
];
const TRANSITIONS = [
  [5, 'Quick'],
  [8, 'Normal'],
  [12, 'Relaxed'],
];

const sw = (act, on, label) => html`<button class="switch" role="switch" data-act="${act}" aria-checked="${on}" aria-label="${label}"></button>`;

export function render(app) {
  const { profile, settings } = app.store.state;
  const voices = englishVoices();
  const where = app.store.status.where;
  return html`
    <header class="stack" style="--gap:6px"><h1 class="display" tabindex="-1">You</h1><p class="lede">Make Unstuck fit you.</p></header>

    <section class="section">
      <h2 class="section-title">About you</h2>
      <div class="card stack" style="--gap:16px">
        <div class="field"><label for="f-name">Your first name <span class="muted">(optional)</span></label><input id="f-name" class="input" value="${profile.name}" maxlength="40" autocomplete="given-name" data-field="name" placeholder="Used in the greeting"></div>
        <div class="field"><span class="label">Daily goal</span><div class="seg" role="group" aria-label="Daily goal">${GOALS.map((g) => html`<button data-act="goal" data-v="${g}" aria-pressed="${profile.goal === g}">${g} min</button>`)}</div></div>
        <div class="field"><span class="label">When you like to practise</span><div class="seg" role="group" aria-label="Time of day">${WHEN.map(([v, l]) => html`<button data-act="when" data-v="${v}" aria-pressed="${profile.when === v}">${l}</button>`)}</div></div>
        <div class="field"><span class="label">Go easy on</span><span class="hint">Old injuries or niggles. Exercises that load these get a warning and are left out of built sessions.</span>
          <div class="chips">${CARE_AREAS.map((c) => html`<button class="chip" data-act="care" data-v="${c.id}" aria-pressed="${profile.care.includes(c.id)}">${c.name}</button>`)}</div></div>
      </div>
    </section>

    <section class="section">
      <h2 class="section-title">During a session</h2>
      <div class="card" style="padding-block:4px">
        <div class="switch-row"><div><div class="t">Hold length</div><div class="d">${HOLD_LENGTHS.find((h) => h.id === settings.hold)?.about || ''}</div></div></div>
        <div class="seg" role="group" aria-label="Hold length" style="margin-bottom:12px">${HOLD_LENGTHS.map((h) => html`<button data-act="hold" data-v="${h.id}" aria-pressed="${settings.hold === h.id}">${h.name}</button>`)}</div>
        <div class="switch-row"><div><div class="t">Voice guidance</div><div class="d">${speechAvailable() ? 'Reads out each exercise and a few cues, so you can keep your eyes closed.' : 'Your browser does not offer speech.'}</div></div>${sw('voice', settings.voice, 'Voice guidance')}</div>
        ${settings.voice && voices.length ? html`<div class="field" style="padding-bottom:14px"><label for="f-voice">Voice</label><select id="f-voice" class="input" data-field="voiceURI"><option value="">Automatic</option>${voices.map((v) => html`<option value="${v.voiceURI}" ${v.voiceURI === settings.voiceURI ? raw('selected') : ''}>${v.name} (${v.lang})</option>`)}</select>
          <div class="row wrap"><div class="seg" role="group" aria-label="Speaking speed" style="flex:1">${[[0.85, 'Slower'], [1, 'Normal'], [1.15, 'Faster']].map(([v, l]) => html`<button data-act="rate" data-v="${v}" aria-pressed="${settings.rate === v}">${l}</button>`)}</div><button class="btn btn-small btn-ghost" data-act="test-voice">${raw(icon('volume'))} Test</button></div></div>` : ''}
        <div class="switch-row"><div><div class="t">Chimes</div><div class="d">A soft bell when a pose starts, when to switch sides, and at the end.</div></div>${sw('chime', settings.chime, 'Chimes')}</div>
        <div class="switch-row"><div><div class="t">Check-ins</div><div class="d">Rate your tension before and after, to see what each session does for you.</div></div>${sw('checkins', settings.checkins, 'Check-ins')}</div>
        <div class="switch-row" style="display:block"><div class="t" style="margin-bottom:8px">Time between exercises</div><div class="seg" role="group" aria-label="Time between exercises">${TRANSITIONS.map(([v, l]) => html`<button data-act="transition" data-v="${v}" aria-pressed="${settings.transition === v}">${l} · ${v}s</button>`)}</div></div>
      </div>
    </section>

    <section class="section">
      <h2 class="section-title">New to this? Start here</h2>
      <div class="card" style="padding-block:4px"><div class="list">${GUIDE.map((g) => html`<button class="list-row" data-go="guide:${g.id}"><span class="grow"><span class="t" style="display:block">${g.title}</span></span>${raw(icon('chev', 'chev'))}</button>`)}</div></div>
    </section>

    <section class="section">
      <h2 class="section-title">Your data</h2>
      <div class="card stack">
        <p>${where === 'cloud' ? html`${raw(icon('check'))} Your progress is saved to your Claude account and follows you to other devices.` : 'Your progress is saved in this browser. Make a backup now and then with Copy backup, especially before clearing your browser data.'}</p>
        <div class="row wrap"><button class="btn btn-small btn-ghost" data-act="export">${raw(icon('copy'))} Copy backup</button><button class="btn btn-small btn-ghost" data-act="import">${raw(icon('upload'))} Restore a backup</button><button class="btn btn-small btn-ghost" data-act="reset">${raw(icon('trash'))} Start over</button></div>
      </div>
    </section>

    <section class="section">
      <h2 class="section-title">About</h2>
      <div class="prose stack muted small">
        <p>Unstuck is a practice guide, not medical advice. Stop if anything hurts, and check with a doctor or physiotherapist if you have an injury or ongoing pain.</p>
        <p>Video classes are by ${[...new Set(VIDEOS.map((v) => v.teacher))].join(', ')}, and open on YouTube. ${LEARN_LINKS.map((l) => html`<a href="${l.url}" target="_blank" rel="noopener noreferrer">${l.title}</a>`)} by ${LEARN_LINKS[0].by}.</p>
        <p>The figure is drawn to scale: 180 cm tall, on a 183 cm mat, with 23 × 15 × 10 cm blocks.</p>
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
    speak("Child's pose. Knees wide, sit back toward your heels, and rest your forehead down.", { voiceURI: s.voiceURI, rate: s.rate });
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
      () => `<h2>${copied ? 'Backup copied' : 'Your backup'}</h2>
        <p class="muted">${copied ? 'It is on your clipboard. Paste it into a note or an email to yourself.' : 'Select all of the text below and copy it somewhere safe.'}</p>
        <label class="sr" for="bk">Backup text</label><textarea id="bk" class="input" readonly style="min-height:180px;font-family:ui-monospace,monospace;font-size:12px">${esc(json)}</textarea>
        <button class="btn" data-a="ok">Done</button>`,
      (box, close) => {
        const ta = box.querySelector('#bk');
        ta.addEventListener('focus', () => ta.select());
        box.querySelector('[data-a="ok"]').onclick = () => close();
      },
    );
  },
  async import(app) {
    const text = await sheet(
      () => `<h2>Restore a backup</h2>
        <p class="muted">Paste a backup below, or choose a backup file. This replaces what is saved now.</p>
        <label class="sr" for="imp">Backup text</label><textarea id="imp" class="input" style="min-height:140px;font-family:ui-monospace,monospace;font-size:12px" placeholder='{"app":"unstuck", ...}'></textarea>
        <input id="imp-file" type="file" accept="application/json,.json,.txt">
        <p class="small" id="imp-err" style="color:var(--glow-text)" hidden></p>
        <div class="row wrap"><button class="btn" data-a="ok">Restore</button><button class="btn btn-ghost" data-a="no">Cancel</button></div>`,
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
            err.textContent = 'That does not look like an Unstuck backup. Paste the whole text, starting with {.';
          }
        };
        box.querySelector('[data-a="no"]').onclick = () => close(null);
      },
    );
    if (!text) return;
    app.store.replace(text);
    toast('Backup restored');
  },
  async reset(app) {
    const ok = await ask('Start over?', 'This deletes all your sessions, checks and settings. It cannot be undone. Copy a backup first if you might want them.', 'Delete everything', 'Cancel');
    if (!ok) return;
    app.store.replace(defaultState());
    toast('Everything is cleared');
  },
};

/** Text fields save as you type (debounced by the app). */
export const fields = {
  name(app, value) {
    app.store.update((s) => {
      s.profile.name = value.slice(0, 40);
    });
  },
  voiceURI(app, value) {
    app.store.update((s) => {
      s.settings.voiceURI = value;
    });
  },
};
