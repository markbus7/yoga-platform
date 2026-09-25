// The full-screen guided session: check-in, timed poses with voice and chimes,
// then a check-out that saves the session to your progress.

import { buildTimeline, timelineSeconds } from './lib/session.js';
import { mountFigure } from './ui/figure-view.js';
import { icon } from './ui/icons.js';
import { esc } from './ui/dom.js';
import { chime, speak, stopSpeaking, unlockAudio, keepAwake } from './lib/audio.js';
import { fmtClock, dayKey } from './lib/dates.js';
import { AREAS } from './data/areas.js';
import { streak } from './lib/stats.js';
import { newId } from './lib/store.js';

const FEELINGS = ['Calmer', 'Looser', 'Lighter', 'Sleepy', 'Energised', 'Same', 'Sore'];

function scaleButtons(selected, attr) {
  let out = '';
  for (let i = 1; i <= 10; i++) out += `<button type="button" data-${attr}="${i}" aria-pressed="${selected === i}">${i}</button>`;
  return out;
}

class Player {
  constructor(app, opts) {
    this.app = app;
    this.opts = opts;
    const s = app.store.state.settings;
    this.voice = s.voice;
    this.chimes = s.chime;
    this.muted = false;
    this.steps = buildTimeline(opts.items, { scale: opts.scale ?? s.hold, transition: s.transition });
    this.planned = timelineSeconds(this.steps);
    this.poseSteps = this.steps.map((st, i) => (st.type === 'pose' ? i : -1)).filter((i) => i >= 0);
    this.exCount = this.steps.filter((st) => st.type === 'move').length;
    this.i = 0;
    this.elapsed = 0;
    this.active = 0;
    this.exSec = {};
    this.paused = true;
    this.spoken = new Set();
    this.before = null;
    this.after = null;
    this.stuck = new Set(opts.stuck || []);
    this.feel = new Set();
    this.cache = {};
    this.el = document.createElement('div');
    this.el.className = 'player on-color';
    this.el.dataset.color = opts.color || 'teal';
    this.el.setAttribute('role', 'dialog');
    this.el.setAttribute('aria-modal', 'true');
    this.el.setAttribute('aria-label', opts.title);
    document.body.appendChild(this.el);
    document.documentElement.style.overflow = 'hidden';
    this.el.addEventListener('click', (e) => this.onClick(e));
    this.onKey = (e) => this.key(e);
    document.addEventListener('keydown', this.onKey);
    this.loop = this.loop.bind(this);
    unlockAudio();
    if (s.checkins) this.showCheckin();
    else this.begin();
  }

  get sound() {
    return !this.muted;
  }

  // ---------- phases ----------

  showCheckin() {
    this.phase = 'checkin';
    const areas = AREAS.map((a) => `<button type="button" class="chip" data-stuck="${a.id}" aria-pressed="${this.stuck.has(a.id)}">${esc(a.name)}</button>`).join('');
    this.el.innerHTML = `
      <div class="player-top"><button class="icon-btn" data-p="quit" aria-label="Close">${icon('close')}</button><div class="grow">${esc(this.opts.title)}</div><span style="width:44px"></span></div>
      <div class="player-done">
        <span class="kicker">Before you start</span>
        <h2>How tense do you feel?</h2>
        <div class="stack" style="width:100%">
          <div class="scale" role="group" aria-label="Tension from 1 to 10">${scaleButtons(this.before, 'before')}</div>
          <div class="scale-ends"><span>1 · Loose</span><span>10 · Locked up</span></div>
        </div>
        <p class="small" style="opacity:.85">Where do you feel stuck? <span style="opacity:.75">(optional)</span></p>
        <div class="chips" style="justify-content:center">${areas}</div>
        <button class="btn btn-lg btn-wide" data-p="begin">${icon('play')} Start</button>
        <button class="link-btn" data-p="begin-skip" style="color:inherit">Skip the check-in</button>
      </div>`;
  }

  begin() {
    unlockAudio();
    keepAwake(true);
    this.phase = 'run';
    this.renderRun();
    this.paused = false;
    this.last = performance.now();
    this.go(0);
    this.raf = requestAnimationFrame(this.loop);
    this.backup = setInterval(() => {
      if (performance.now() - this.last > 1500) this.loop(performance.now(), true);
    }, 1000);
  }

  renderRun() {
    const segs = this.poseSteps.map(() => '<i><b></b></i>').join('');
    this.el.innerHTML = `
      <div class="player-top">
        <button class="icon-btn" data-p="close" aria-label="End session">${icon('close')}</button>
        <div class="grow"><span data-r="count"></span> · <span data-r="left"></span></div>
        <button class="icon-btn" data-p="sound" aria-label="Sound" aria-pressed="true">${icon('volume')}</button>
      </div>
      <div class="segs" aria-hidden="true">${segs}</div>
      <div class="player-main">
        <div class="player-stage">
          <div class="player-fig" data-r="fig"></div>
          <div class="orb-wrap" data-r="orbwrap" hidden><div class="orb" data-r="orb"><span data-r="orbtext"></span></div></div>
        </div>
        <div class="player-info">
          <span class="kicker" data-r="kicker"></span>
          <span class="side" data-r="side" hidden></span>
          <h2 data-r="name" aria-live="polite"></h2>
          <div class="clock" data-r="clock" aria-hidden="true"></div>
          <p class="cue" data-r="cue"></p>
          <div class="controls">
            <button class="icon-btn" data-p="prev" aria-label="Go back">${icon('prev')}</button>
            <button class="icon-btn play" data-p="toggle" aria-label="Pause">${icon('pause')}</button>
            <button class="icon-btn" data-p="next" aria-label="Skip">${icon('next')}</button>
          </div>
          <p class="next-up" data-r="nextup"></p>
        </div>
      </div>`;
    this.r = {};
    this.el.querySelectorAll('[data-r]').forEach((n) => {
      this.r[n.dataset.r] = n;
    });
    this.segEls = [...this.el.querySelectorAll('.segs i')];
    this.figure = null;
  }

  // ---------- running ----------

  go(index, quiet = false) {
    this.i = index;
    this.elapsed = 0;
    this.spoken = new Set();
    this.cueIdx = -1;
    if (index >= this.steps.length) return this.finish();
    const st = this.steps[index];
    const ex = st.ex;
    const isBreath = ex.kind === 'breath';
    const nextPose = this.steps.slice(index + 1).find((x) => x.type === 'move');

    // text
    const exNum = this.steps.slice(0, index + 1).filter((x) => x.type === 'move').length;
    this.set('count', `${exNum} of ${this.exCount}`);
    this.set('name', ex.name);
    this.r.kicker.textContent = st.type === 'move' ? (st.first ? 'First up' : 'Next up') : st.type === 'switch' ? 'Switch sides' : isBreath ? 'Breathe' : ex.kind === 'flow' ? 'Move slowly' : 'Hold and relax';
    const side = st.type === 'pose' && ex.sides ? ex.sideLabels[st.side] : st.type === 'switch' ? ex.sideLabels[1] : st.type === 'move' && ex.sides ? ex.sideLabels[0] : '';
    this.r.side.hidden = !side;
    this.r.side.textContent = side;
    this.r.nextup.textContent = st.type === 'pose' && nextPose ? `Next: ${nextPose.ex.name}` : st.type === 'pose' && ex.sides && st.side === 0 ? 'Then the other side' : '';
    if (st.type === 'pose' && !nextPose && !(ex.sides && st.side === 0)) this.r.nextup.textContent = 'Last one';
    this.showCue(st.type === 'move' ? ex.setup.join(' ') : st.type === 'switch' ? 'Come out slowly, then set up the other side.' : ex.cues[0]);

    // figure or breathing orb
    this.r.orbwrap.hidden = !(isBreath && st.type === 'pose');
    this.r.fig.style.visibility = isBreath && st.type === 'pose' ? 'hidden' : 'visible';
    const mirror = (st.type === 'pose' && st.side === 1) || st.type === 'switch';
    const mode = st.type === 'pose' ? 'hold' : 'enter';
    const enterSec = Math.max(2, Math.min(st.sec - 1.5, 4));
    if (!this.figure) this.figure = mountFigure(this.r.fig, ex.fig, { mode, mirror, enterSec, label: ex.name });
    else if (this.figSpec !== ex.fig) this.figure.setSpec(ex.fig, { mode, mirror, enterSec });
    else {
      this.figure.setMirror(mirror);
      this.figure.setMode(mode, { enterSec, restart: st.type !== 'pose' || ex.kind === 'hold' });
    }
    this.figSpec = ex.fig;
    if (this.paused) this.figure.pause();

    // segments
    this.segEls.forEach((el, k) => {
      const done = this.poseSteps[k] < index;
      el.classList.toggle('done', done);
      el.firstChild.style.width = done ? '100%' : '0';
    });

    // sound
    if (!quiet && this.sound) {
      if (st.type === 'move') {
        if (this.chimes) chime('next', this.app.store.state.settings.volume);
        if (this.voice) speak(`${st.first ? 'First' : 'Next'}: ${ex.say}`, this.voiceOpts());
      } else if (st.type === 'switch') {
        if (this.chimes) chime('switch', this.app.store.state.settings.volume);
        if (this.voice) speak(`Switch sides. ${ex.sideLabels[1]}.`, this.voiceOpts());
      } else if (this.chimes) chime('start', this.app.store.state.settings.volume);
    }
    this.paint(true);
  }

  voiceOpts() {
    const s = this.app.store.state.settings;
    return { voiceURI: s.voiceURI, rate: s.rate };
  }

  loop(now, fromBackup = false) {
    const dt = Math.max(0, (now - this.last) / 1000);
    this.last = now;
    if (this.phase === 'run' && !this.paused) this.advance(dt);
    if (this.phase === 'run') this.paint();
    if (!fromBackup && this.phase === 'run') this.raf = requestAnimationFrame(this.loop);
  }

  advance(dt) {
    const quiet = dt > 2;
    while (dt > 0 && this.i < this.steps.length) {
      const st = this.steps[this.i];
      const use = Math.min(dt, st.sec - this.elapsed);
      this.elapsed += use;
      this.active += use;
      dt -= use;
      if (st.type === 'pose') this.exSec[st.ex.id] = (this.exSec[st.ex.id] || 0) + use;
      if (!quiet) this.timedCues(st);
      if (this.elapsed >= st.sec - 1e-6) this.go(this.i + 1, quiet && dt > 0);
      if (this.phase !== 'run') return;
    }
  }

  timedCues(st) {
    const ex = st.ex;
    if (st.type !== 'pose') return;
    if (ex.kind === 'breath') {
      const b = this.breathPhase(ex);
      const key = `b${b.cycle}-${b.index}`;
      if (b.cycle < 2 && !this.spoken.has(key)) {
        this.spoken.add(key);
        if (this.sound && this.voice) speak(b.label, this.voiceOpts());
      }
      return;
    }
    // rotate written cues through the hold
    const every = Math.max(12, st.sec / Math.max(1, ex.cues.length));
    const idx = Math.floor(this.elapsed / every) % ex.cues.length;
    if (idx !== this.cueIdx) {
      this.cueIdx = idx;
      if (this.elapsed > 1) this.showCue(ex.cues[idx]);
    }
    // speak a reminder partway through longer poses
    const marks = st.sec >= 90 ? [0.45, 0.78] : st.sec >= 40 ? [0.5] : [];
    marks.forEach((m, k) => {
      const key = 'm' + k;
      if (this.elapsed >= st.sec * m && !this.spoken.has(key)) {
        this.spoken.add(key);
        const cue = ex.cues[(k + 1) % ex.cues.length];
        this.showCue(cue);
        if (this.sound && this.voice) speak(cue, this.voiceOpts());
      }
    });
    if (st.sec - this.elapsed <= 3.2 && !this.spoken.has('end') && ex.exit && (!ex.sides || st.side === 1)) {
      this.spoken.add('end');
      this.showCue(ex.exit);
      if (this.sound && this.voice) speak(ex.exit, this.voiceOpts());
    }
  }

  breathPhase(ex) {
    const pattern = ex.breath;
    const cycleLen = pattern.reduce((a, p) => a + p.sec, 0);
    const t = this.elapsed % cycleLen;
    const cycle = Math.floor(this.elapsed / cycleLen);
    let acc = 0;
    let prevLevel = pattern[pattern.length - 1].level;
    for (let index = 0; index < pattern.length; index++) {
      const p = pattern[index];
      if (t < acc + p.sec) {
        const u = (t - acc) / p.sec;
        const e = 0.5 - 0.5 * Math.cos(Math.PI * u);
        const level = prevLevel + (p.level - prevLevel) * e;
        return { label: p.label, index, cycle, level, left: Math.ceil(acc + p.sec - t) };
      }
      acc += p.sec;
      prevLevel = p.level;
    }
    return { label: pattern[0].label, index: 0, cycle, level: 0, left: 0 };
  }

  set(key, text) {
    if (this.cache[key] !== text) {
      this.cache[key] = text;
      this.r[key].textContent = text;
    }
  }

  showCue(text) {
    const el = this.r.cue;
    if (!el || el.textContent === text) return;
    el.classList.add('fade');
    clearTimeout(this.cueTimer);
    this.cueTimer = setTimeout(() => {
      el.textContent = text;
      el.classList.remove('fade');
    }, 220);
  }

  paint() {
    const st = this.steps[this.i];
    if (!st) return;
    const remain = Math.max(0, st.sec - this.elapsed);
    this.set('clock', st.type === 'pose' ? fmtClock(remain) : String(Math.max(1, Math.ceil(remain))));
    let left = remain;
    for (let k = this.i + 1; k < this.steps.length; k++) left += this.steps[k].sec;
    this.set('left', `${fmtClock(left)} left`);
    const k = this.poseSteps.indexOf(this.i);
    if (k >= 0) this.segEls[k].firstChild.style.width = `${Math.min(100, (this.elapsed / st.sec) * 100)}%`;
    if (st.ex.kind === 'breath' && st.type === 'pose') {
      const b = this.breathPhase(st.ex);
      this.r.orb.style.setProperty('--s', (0.55 + 0.45 * b.level).toFixed(3));
      this.set('orbtext', `${b.label} ${b.left}`);
    }
  }

  // ---------- controls ----------

  toggle() {
    this.paused = !this.paused;
    this.last = performance.now();
    const btn = this.el.querySelector('[data-p="toggle"]');
    btn.innerHTML = icon(this.paused ? 'play' : 'pause');
    btn.setAttribute('aria-label', this.paused ? 'Resume' : 'Pause');
    if (this.paused) {
      stopSpeaking();
      if (this.figure) this.figure.pause();
    } else if (this.figure) this.figure.play();
  }

  skip() {
    let j = this.i + 1;
    if (this.steps[j] && this.steps[j].type === 'switch') j++;
    this.go(j);
  }

  prev() {
    if (this.elapsed > 3) return this.go(this.i);
    for (let j = this.i - 1; j >= 0; j--) {
      if (this.steps[j].type === 'move') return this.go(j);
    }
    this.go(0);
  }

  confirmEnd() {
    if (!this.paused) this.toggle();
    const box = document.createElement('div');
    box.className = 'confirm';
    const worth = this.active >= 60;
    box.innerHTML = `<div><h3>End this session?</h3>
      <p style="opacity:.85">${worth ? 'You can save what you did so far.' : 'Less than a minute so far, so there is nothing to save yet.'}</p>
      <button class="btn" data-p="resume">Keep going</button>
      ${worth ? '<button class="btn btn-ghost" data-p="finish">Finish and save</button>' : ''}
      <button class="btn btn-ghost" data-p="quit">${worth ? 'Discard' : 'Leave'}</button></div>`;
    this.el.appendChild(box);
    box.querySelector('[data-p="resume"]').focus();
  }

  key(e) {
    if (this.phase !== 'run') {
      if (e.key === 'Escape' && this.phase === 'checkin') this.close();
      return;
    }
    const confirmOpen = this.el.querySelector('.confirm');
    if (e.key === 'Escape') {
      if (confirmOpen) {
        confirmOpen.remove();
        this.toggle();
      } else this.confirmEnd();
      e.preventDefault();
    } else if (confirmOpen) {
      return;
    } else if (e.key === ' ' && e.target === document.body) {
      this.toggle();
      e.preventDefault();
    } else if (e.key === 'ArrowRight') this.skip();
    else if (e.key === 'ArrowLeft') this.prev();
  }

  onClick(e) {
    const t = e.target.closest('[data-p], [data-before], [data-after], [data-stuck], [data-feel]');
    if (!t) return;
    if (t.dataset.before) {
      this.before = +t.dataset.before;
      this.el.querySelectorAll('[data-before]').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.before === this.before)));
      return;
    }
    if (t.dataset.after) {
      this.after = +t.dataset.after;
      this.el.querySelectorAll('[data-after]').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.after === this.after)));
      return;
    }
    if (t.dataset.stuck) {
      const a = t.dataset.stuck;
      if (this.stuck.has(a)) this.stuck.delete(a);
      else this.stuck.add(a);
      t.setAttribute('aria-pressed', String(this.stuck.has(a)));
      return;
    }
    if (t.dataset.feel) {
      const a = t.dataset.feel;
      if (this.feel.has(a)) this.feel.delete(a);
      else this.feel.add(a);
      t.setAttribute('aria-pressed', String(this.feel.has(a)));
      return;
    }
    const act = t.dataset.p;
    if (act === 'begin') this.begin();
    else if (act === 'begin-skip') {
      this.before = null;
      this.stuck.clear();
      this.begin();
    } else if (act === 'toggle') this.toggle();
    else if (act === 'next') this.skip();
    else if (act === 'prev') this.prev();
    else if (act === 'close') this.confirmEnd();
    else if (act === 'resume') {
      this.el.querySelector('.confirm').remove();
      this.toggle();
    } else if (act === 'finish') this.finish();
    else if (act === 'quit') this.close();
    else if (act === 'sound') {
      this.muted = !this.muted;
      if (this.muted) stopSpeaking();
      t.innerHTML = icon(this.muted ? 'mute' : 'volume');
      t.setAttribute('aria-pressed', String(!this.muted));
      t.setAttribute('aria-label', this.muted ? 'Sound off' : 'Sound on');
    } else if (act === 'save') this.save();
    else if (act === 'discard') this.close();
  }

  // ---------- finishing ----------

  finish() {
    if (this.phase === 'done') return;
    this.phase = 'done';
    cancelAnimationFrame(this.raf);
    clearInterval(this.backup);
    keepAwake(false);
    const completed = this.i >= this.steps.length;
    this.completed = completed;
    if (this.sound) {
      if (this.chimes) chime('done', this.app.store.state.settings.volume);
      if (this.voice && completed) speak('Well done. Take a moment to notice how your body feels.', this.voiceOpts());
    }
    const state = this.app.store.state;
    const today = dayKey();
    const minutes = Math.max(1, Math.round(this.active / 60));
    const poses = Object.keys(this.exSec).length;
    const nextStreak = streak([...state.sessions, { day: today, sec: this.active }], today).days;
    const feel = FEELINGS.map((f) => `<button type="button" class="chip" data-feel="${f}" aria-pressed="false">${f}</button>`).join('');
    this.el.innerHTML = `
      <div class="player-top"><span style="width:44px"></span><div class="grow">${esc(this.opts.title)}</div><span style="width:44px"></span></div>
      <div class="player-done">
        <span class="kicker">${completed ? 'Session complete' : 'Session ended early'}</span>
        <h2>${completed ? 'Nice work.' : 'Every minute counts.'}</h2>
        <div class="done-stats">
          <div><b>${minutes}</b><span>${minutes === 1 ? 'minute' : 'minutes'}</span></div>
          <div><b>${poses}</b><span>${poses === 1 ? 'exercise' : 'exercises'}</span></div>
          ${nextStreak ? `<div><b>${nextStreak}</b><span>day streak</span></div>` : ''}
        </div>
        ${state.settings.checkins ? `
        <div class="stack" style="width:100%">
          <p style="font-weight:800;font-size:18px">How tense do you feel now?</p>
          ${this.before ? `<p class="small" style="opacity:.8">Before: ${this.before}</p>` : ''}
          <div class="scale" role="group" aria-label="Tension from 1 to 10">${scaleButtons(this.after, 'after')}</div>
          <div class="scale-ends"><span>1 · Loose</span><span>10 · Locked up</span></div>
        </div>` : ''}
        <p style="font-weight:800">How do you feel?</p>
        <div class="chips" style="justify-content:center">${feel}</div>
        <label class="sr" for="p-note">Note</label>
        <textarea id="p-note" class="input" placeholder="Anything to remember? (optional)"></textarea>
        <button class="btn btn-lg btn-wide" data-p="save">${icon('check')} Save session</button>
        <button class="link-btn" data-p="discard" style="color:inherit">Don't save</button>
      </div>`;
  }

  save() {
    const note = (this.el.querySelector('#p-note') || {}).value || '';
    const ex = {};
    for (const [id, sec] of Object.entries(this.exSec)) ex[id] = Math.round(sec);
    const today = dayKey();
    const session = {
      id: newId(),
      t: Date.now(),
      day: today,
      title: this.opts.title,
      routineId: this.opts.routineId || null,
      source: this.opts.source || 'routine',
      programDay: this.opts.programDay || null,
      sec: Math.round(this.active),
      planned: Math.round(this.planned),
      completed: !!this.completed,
      ex,
      before: this.before,
      after: this.after,
      feel: [...this.feel],
      stuck: [...this.stuck],
      note: note.trim().slice(0, 500),
    };
    const countsForPlan = this.opts.programDay && this.active >= this.planned * 0.7;
    this.app.store.addSession(session, (s) => {
      if (countsForPlan && !s.program.done[this.opts.programDay]) {
        s.program.done[this.opts.programDay] = today;
        if (!s.program.startedAt) s.program.startedAt = today;
      }
    });
    this.close();
    this.app.afterSession(session, !!countsForPlan);
  }

  close() {
    this.phase = 'closed';
    cancelAnimationFrame(this.raf);
    clearInterval(this.backup);
    clearTimeout(this.cueTimer);
    stopSpeaking();
    keepAwake(false);
    document.removeEventListener('keydown', this.onKey);
    document.documentElement.style.overflow = '';
    this.el.remove();
    this.app.player = null;
  }
}

/**
 * @param app  the app (store, afterSession)
 * @param opts {title, color, items: [{id, sec}], source, routineId, programDay, scale, stuck}
 */
export function startSession(app, opts) {
  if (app.player) app.player.close();
  app.player = new Player(app, opts);
  return app.player;
}
