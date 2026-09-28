// The full-screen guided session: check-in, timed poses with voice and chimes,
// then a check-out that saves the session to your progress.

import { buildTimeline, timelineSeconds, needsDemo } from './lib/session.js';
import { mountFigure } from './ui/figure-view.js';
import { icon } from './ui/icons.js';
import { esc } from './ui/dom.js';
import { chime, speak, stopSpeaking, unlockAudio, keepAwake, speechAvailable } from './lib/audio.js';
import { startAmbient, pauseAmbient, resumeAmbient, stopAmbient } from './lib/ambient.js';
import { viewPick, viewOf } from './ui/viewpick.js';
import { fmtClock, dayKey } from './lib/dates.js';
import { AREAS } from './data/areas.js';
import { figureFor } from './data/exercises.js';
import { streak } from './lib/stats.js';
import { newId } from './lib/store.js';
import { t, lang } from './i18n.js';

// Saved as ids, shown in the current language.
const FEELINGS = ['calmer', 'looser', 'lighter', 'sleepy', 'energised', 'same', 'sore'];

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
    // Toe spreaders: remind once, as you set up the first hold where your feet are free.
    this.spreaders = !!app.store.state.profile.spreaders;
    this.spreaderStep = this.spreaders ? this.steps.findIndex((st) => st.type === 'move' && st.ex.spreaders) : -1;
    // Exercises to show step by step before the clock starts (see Settings).
    const { sessions } = app.store.state;
    this.demoFor = new Set(this.steps.filter((st) => st.type === 'move' && needsDemo(st.ex.id, s, sessions)).map((st) => st.ex.id));
    this.demoShown = new Set();
    this.learning = null;
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
      <div class="player-top"><button class="icon-btn" data-p="quit" aria-label="${esc(t('player.close'))}">${icon('close')}</button><div class="grow">${esc(this.opts.title)}</div><span style="width:44px"></span></div>
      <div class="player-done">
        <span class="kicker">${esc(t('player.before'))}</span>
        <h2>${esc(t('player.howTense'))}</h2>
        <div class="stack" style="width:100%">
          <div class="scale" role="group" aria-label="${esc(t('player.tensionAria'))}">${scaleButtons(this.before, 'before')}</div>
          <div class="scale-ends"><span>${esc(t('player.loose'))}</span><span>${esc(t('player.locked'))}</span></div>
        </div>
        ${this.spreaderStep >= 0 ? `<p class="gear-note">${icon('foot')}<span>${esc(t('player.spreadersTip'))}</span></p>` : ''}
        <p class="small" style="opacity:.85">${esc(t('player.whereStuck'))} <span style="opacity:.75">${esc(t('player.optional'))}</span></p>
        <div class="chips" style="justify-content:center">${areas}</div>
        <button class="btn btn-lg btn-wide" data-p="begin">${icon('play')} ${esc(t('player.start'))}</button>
        <button class="link-btn" data-p="begin-skip" style="color:inherit">${esc(t('player.skipCheckin'))}</button>
      </div>`;
  }

  begin() {
    unlockAudio();
    keepAwake(true);
    this.phase = 'run';
    this.renderRun();
    this.paused = false;
    const s = this.app.store.state.settings;
    if (s.ambient !== 'off') startAmbient(s.ambient, s.ambientVol);
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
        <button class="icon-btn" data-p="close" aria-label="${esc(t('player.end'))}">${icon('close')}</button>
        <div class="grow"><span data-r="count"></span> · <span data-r="left"></span></div>
        <button class="icon-btn" data-p="howto" aria-label="${esc(t('player.howTo'))}" title="${esc(t('player.howTo'))}">${icon('info')}</button>
        ${speechAvailable() ? `<button class="icon-btn" data-p="replay" aria-label="${esc(t('player.replay'))}" title="${esc(t('player.replay'))}">${icon('replay')}</button>` : ''}
        <button class="icon-btn" data-p="sound" aria-label="${esc(t('player.sound'))}" aria-pressed="true">${icon('volume')}</button>
      </div>
      <div class="segs" aria-hidden="true">${segs}</div>
      <div class="player-main">
        <div class="player-stage">
          <div class="player-fig" data-r="fig"></div>
          <div class="stage-views" data-r="views"></div>
          <div class="orb-wrap" data-r="orbwrap" hidden><div class="orb" data-r="orb"><span data-r="orbtext"></span></div></div>
        </div>
        <div class="player-info">
          <span class="kicker" data-r="kicker"></span>
          <span class="side" data-r="side" hidden></span>
          <span class="gear" data-r="gear" hidden>${icon('foot')}<span>${esc(t('player.spreaders'))}</span></span>
          <h2 data-r="name" aria-live="polite"></h2>
          <div class="clock" data-r="clock" aria-hidden="true"></div>
          <p class="cue" data-r="cue"></p>
          <div class="controls">
            <button class="icon-btn" data-p="prev" aria-label="${esc(t('player.goBack'))}">${icon('prev')}</button>
            <button class="icon-btn play" data-p="toggle" aria-label="${esc(t('player.pause'))}">${icon('pause')}</button>
            <button class="icon-btn" data-p="next" aria-label="${esc(t('player.skip'))}">${icon('next')}</button>
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
    if (st.type === 'move' && this.demoFor.has(ex.id) && !this.demoShown.has(ex.id)) return this.showDemo(index);
    const isBreath = ex.kind === 'breath';
    const nextPose = this.steps.slice(index + 1).find((x) => x.type === 'move');

    // text
    const exNum = this.steps.slice(0, index + 1).filter((x) => x.type === 'move').length;
    this.set('count', t('player.count', { n: exNum, total: this.exCount }));
    this.set('name', ex.name);
    this.r.kicker.textContent = t(st.type === 'move' ? (st.first ? 'player.firstUp' : 'player.nextUp') : st.type === 'switch' ? 'player.switch' : isBreath ? 'player.breathe' : ex.kind === 'flow' ? 'player.moveSlowly' : 'player.hold');
    const side = st.type === 'pose' && ex.sides ? ex.sideLabels[st.side] : st.type === 'switch' ? ex.sideLabels[1] : st.type === 'move' && ex.sides ? ex.sideLabels[0] : '';
    this.r.side.hidden = !side;
    this.r.side.textContent = side;
    this.r.nextup.textContent = st.type === 'pose' && nextPose ? t('player.next', { name: nextPose.ex.name }) : st.type === 'pose' && ex.sides && st.side === 0 ? t('player.otherSide') : '';
    if (st.type === 'pose' && !nextPose && !(ex.sides && st.side === 0)) this.r.nextup.textContent = t('player.lastOne');
    this.showCue(st.type === 'move' ? ex.setup.join(' ') : st.type === 'switch' ? t('player.switchCue') : ex.cues[0]);

    // figure or breathing orb
    this.r.orbwrap.hidden = !(isBreath && st.type === 'pose');
    this.r.fig.style.visibility = isBreath && st.type === 'pose' ? 'hidden' : 'visible';
    const mirror = (st.type === 'pose' && st.side === 1) || st.type === 'switch';
    const mode = st.type === 'pose' ? 'hold' : 'enter';
    const enterSec = Math.max(2, Math.min(st.sec - 1.5, 4));
    const spec = figureFor(ex, this.spreaders, viewOf(this.app, ex));
    const pickKey = isBreath && st.type === 'pose' ? '' : `${ex.id}:${viewOf(this.app, ex)}`;
    if (this.pickKey !== pickKey) {
      this.pickKey = pickKey;
      this.r.views.innerHTML = pickKey ? viewPick(ex, viewOf(this.app, ex), 'data-p') : '';
    }
    if (!this.figure) this.figure = mountFigure(this.r.fig, spec, { mode, mirror, enterSec, label: ex.name });
    else if (this.figSpec !== spec) this.figure.setSpec(spec, { mode, mirror, enterSec });
    else {
      this.figure.setMirror(mirror);
      this.figure.setMode(mode, { enterSec, restart: st.type !== 'pose' || ex.kind === 'hold' });
    }
    this.figSpec = spec;
    this.r.gear.hidden = !(this.spreaderStep >= 0 && index === this.spreaderStep);
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
        const gear = index === this.spreaderStep ? ' ' + t('say.spreaders') : '';
        if (this.voice) speak(t(st.first ? 'say.first' : 'say.next', { text: ex.say }) + gear, this.voiceOpts());
      } else if (st.type === 'switch') {
        if (this.chimes) chime('switch', this.app.store.state.settings.volume);
        if (this.voice) speak(t('say.switch', { side: ex.sideLabels[1] }), this.voiceOpts());
      } else if (this.chimes) chime('start', this.app.store.state.settings.volume);
    }
    this.paint(true);
  }

  // ---------- how-to, before the clock starts ----------

  /**
   * Show how to do the exercise at step `index`: a looping demo, the steps and
   * tips, read aloud. The clock waits. With `resume` it was opened from the
   * running session and "Continue" picks up where you were.
   */
  showDemo(index, { resume = false } = {}) {
    if (this.learning !== null || !this.steps[index]) return;
    const st = this.steps[index];
    const ex = st.ex;
    this.learning = index;
    this.learnResume = resume;
    this.wasPlaying = !this.paused;
    if (!resume) {
      this.i = index;
      this.elapsed = 0;
    }
    if (!this.paused) this.toggle();
    const exNum = this.steps.slice(0, index + 1).filter((x) => x.type === 'move').length;
    const tip = (label, text) => (text ? `<div class="learn-tip"><b>${esc(label)}</b> ${esc(text)}</div>` : '');
    const box = document.createElement('div');
    box.className = 'learn';
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', t('learn.title'));
    box.innerHTML = `
      <div class="player-top">
        <button class="icon-btn" data-p="close" aria-label="${esc(t('player.end'))}">${icon('close')}</button>
        <div class="grow">${esc(t('player.count', { n: exNum, total: this.exCount }))}</div>
        <span style="width:44px"></span>
      </div>
      <div class="learn-body">
        <div class="learn-fig" data-learn-fig></div>
        ${viewPick(ex, viewOf(this.app, ex), 'data-p')}
        <span class="kicker">${esc(t('learn.title'))}</span>
        <h2 tabindex="-1">${esc(ex.name)}</h2>
        ${speechAvailable() ? `<button class="btn btn-ghost btn-small learn-replay" data-p="replay">${icon('replay')} ${esc(t('learn.replay'))}</button>` : ''}
        <ol class="learn-steps">${ex.setup.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
        ${ex.sides ? `<p class="learn-note">${esc(t('learn.sides', { a: ex.sideLabels[0], b: ex.sideLabels[1] }))}</p>` : ''}
        ${tip(t('ex.feelIt') + ':', ex.feel)}
        ${tip(t('ex.easier') + ':', ex.easier)}
      </div>
      <div class="learn-actions">
        <button class="btn btn-lg btn-wide" data-p="learn-go">${icon('play')} ${esc(t(resume ? 'learn.resume' : 'learn.go'))}</button>
        ${resume ? '' : `<button class="link-btn" data-p="learn-known" style="color:inherit">${esc(t('learn.known'))}</button>`}
      </div>`;
    this.el.appendChild(box);
    this.learnFig = mountFigure(box.querySelector('[data-learn-fig]'), figureFor(ex, this.spreaders, viewOf(this.app, ex)), { mode: 'preview', label: ex.name });
    box.querySelector('h2').focus({ preventScroll: true });
    this.syncAmbient();
    if (this.sound && this.voice) this.sayHowTo(ex);
  }

  endDemo(known = false) {
    const index = this.learning;
    if (index === null) return;
    const id = this.steps[index].ex.id;
    this.demoShown.add(id);
    if (known) {
      this.app.store.update((s) => {
        if (!s.settings.known.includes(id)) s.settings.known.push(id);
      });
    }
    stopSpeaking();
    const box = this.el.querySelector('.learn');
    if (box) box.remove();
    this.learnFig = null;
    this.learning = null;
    if (this.learnResume) {
      // back to where you were; play on if the session was running
      if (this.wasPlaying && this.paused) this.toggle();
      this.syncAmbient();
      return;
    }
    this.go(index, true);
    if (this.sound && this.chimes) chime('next', this.app.store.state.settings.volume);
    if (this.paused) this.toggle();
  }

  sayHowTo(ex) {
    speak([ex.name + '.', ...ex.setup].join(' '), this.voiceOpts());
  }

  /** Say the current instruction again (it plays even when the voice is off: you asked). */
  replay() {
    if (this.learning !== null) return this.sayHowTo(this.steps[this.learning].ex);
    const st = this.steps[this.i];
    if (!st) return;
    const ex = st.ex;
    if (st.type === 'switch') return speak(t('say.switch', { side: ex.sideLabels[1] }), this.voiceOpts());
    const cue = st.type === 'pose' && this.r.cue ? this.r.cue.textContent : '';
    speak([ex.say, cue].filter(Boolean).join(' '), this.voiceOpts());
  }

  /** Switch the camera angle for the exercise on screen (remembered for this visit). */
  setView(v) {
    const index = this.learning ?? this.i;
    const st = this.steps[index];
    if (!st) return;
    const ex = st.ex;
    this.app.ui.views[ex.id] = v;
    this.el.querySelectorAll('[data-p="view"]').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.v === v)));
    const spec = figureFor(ex, this.spreaders, v);
    if (this.learnFig) this.learnFig.setSpec(spec, { mode: 'preview' });
    const cur = this.steps[this.i];
    if (this.figure && cur && cur.ex === ex && this.figSpec !== spec) {
      const mirror = (cur.type === 'pose' && cur.side === 1) || cur.type === 'switch';
      this.figure.setSpec(spec, { mode: cur.type === 'pose' ? 'hold' : 'enter', mirror, enterSec: Math.max(2, Math.min(cur.sec - 1.5, 4)) });
      this.figSpec = spec;
      if (this.paused) this.figure.pause();
    }
  }

  /** Background sound plays while the session runs (and while you read a how-to), unless muted. */
  syncAmbient() {
    if (this.phase !== 'run') return;
    if (!this.muted && (!this.paused || this.learning !== null)) resumeAmbient();
    else pauseAmbient();
  }

  voiceOpts() {
    const s = this.app.store.state.settings;
    return { voiceURI: s.voices[lang()] || '', rate: s.rate, lang: lang() };
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
      if (this.phase !== 'run' || this.learning !== null) return;
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
    const at = this.elapsed % cycleLen;
    const cycle = Math.floor(this.elapsed / cycleLen);
    let acc = 0;
    let prevLevel = pattern[pattern.length - 1].level;
    for (let index = 0; index < pattern.length; index++) {
      const p = pattern[index];
      if (at < acc + p.sec) {
        const u = (at - acc) / p.sec;
        const e = 0.5 - 0.5 * Math.cos(Math.PI * u);
        const level = prevLevel + (p.level - prevLevel) * e;
        return { label: p.label, index, cycle, level, left: Math.ceil(acc + p.sec - at) };
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
    this.set('left', t('player.left', { time: fmtClock(left) }));
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
    btn.setAttribute('aria-label', t(this.paused ? 'player.resume' : 'player.pause'));
    if (this.paused) {
      stopSpeaking();
      if (this.figure) this.figure.pause();
    } else if (this.figure) this.figure.play();
    this.syncAmbient();
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
    box.innerHTML = `<div><h3>${esc(t('player.endQ'))}</h3>
      <p style="opacity:.85">${esc(t(worth ? 'player.endSave' : 'player.endShort'))}</p>
      <button class="btn" data-p="resume">${esc(t('player.keepGoing'))}</button>
      ${worth ? `<button class="btn btn-ghost" data-p="finish">${esc(t('player.finishSave'))}</button>` : ''}
      <button class="btn btn-ghost" data-p="quit">${esc(t(worth ? 'player.discard' : 'player.leave'))}</button></div>`;
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
        if (this.learning === null) this.toggle();
      } else this.confirmEnd();
      e.preventDefault();
    } else if (confirmOpen) {
      return;
    } else if (this.learning !== null) {
      if ((e.key === 'Enter' || e.key === ' ') && e.target === document.body) {
        this.endDemo();
        e.preventDefault();
      }
    } else if (e.key === ' ' && e.target === document.body) {
      this.toggle();
      e.preventDefault();
    } else if (e.key === 'ArrowRight') this.skip();
    else if (e.key === 'ArrowLeft') this.prev();
  }

  onClick(e) {
    const el = e.target.closest('[data-p], [data-before], [data-after], [data-stuck], [data-feel]');
    if (!el) return;
    if (el.dataset.before) {
      this.before = +el.dataset.before;
      this.el.querySelectorAll('[data-before]').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.before === this.before)));
      return;
    }
    if (el.dataset.after) {
      this.after = +el.dataset.after;
      this.el.querySelectorAll('[data-after]').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.after === this.after)));
      return;
    }
    if (el.dataset.stuck) {
      const a = el.dataset.stuck;
      if (this.stuck.has(a)) this.stuck.delete(a);
      else this.stuck.add(a);
      el.setAttribute('aria-pressed', String(this.stuck.has(a)));
      return;
    }
    if (el.dataset.feel) {
      const a = el.dataset.feel;
      if (this.feel.has(a)) this.feel.delete(a);
      else this.feel.add(a);
      el.setAttribute('aria-pressed', String(this.feel.has(a)));
      return;
    }
    const act = el.dataset.p;
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
      if (this.learning === null) this.toggle();
    } else if (act === 'learn-go') this.endDemo();
    else if (act === 'learn-known') this.endDemo(true);
    else if (act === 'howto') this.showDemo(this.i, { resume: true });
    else if (act === 'replay') this.replay();
    else if (act === 'view') this.setView(+el.dataset.v);
    else if (act === 'finish') this.finish();
    else if (act === 'quit') this.close();
    else if (act === 'sound') {
      this.muted = !this.muted;
      if (this.muted) stopSpeaking();
      this.syncAmbient();
      el.innerHTML = icon(this.muted ? 'mute' : 'volume');
      el.setAttribute('aria-pressed', String(!this.muted));
      el.setAttribute('aria-label', t(this.muted ? 'player.soundOff' : 'player.soundOn'));
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
    stopAmbient(4);
    if (this.sound) {
      if (this.chimes) chime('done', this.app.store.state.settings.volume);
      if (this.voice && completed) speak(t('say.done'), this.voiceOpts());
    }
    const state = this.app.store.state;
    const today = dayKey();
    const minutes = Math.max(1, Math.round(this.active / 60));
    const poses = Object.keys(this.exSec).length;
    const nextStreak = streak([...state.sessions, { day: today, sec: this.active }], today).days;
    const feel = FEELINGS.map((f) => `<button type="button" class="chip" data-feel="${f}" aria-pressed="false">${esc(t('feel.' + f))}</button>`).join('');
    this.el.innerHTML = `
      <div class="player-top"><span style="width:44px"></span><div class="grow">${esc(this.opts.title)}</div><span style="width:44px"></span></div>
      <div class="player-done">
        <span class="kicker">${esc(t(completed ? 'player.complete' : 'player.endedEarly'))}</span>
        <h2>${esc(t(completed ? 'player.niceWork' : 'player.everyMinute'))}</h2>
        <div class="done-stats">
          <div><b>${minutes}</b><span>${esc(t('player.minutes', { n: minutes }))}</span></div>
          <div><b>${poses}</b><span>${esc(t('player.exercises', { n: poses }))}</span></div>
          ${nextStreak ? `<div><b>${nextStreak}</b><span>${esc(t('player.streak'))}</span></div>` : ''}
        </div>
        ${state.settings.checkins ? `
        <div class="stack" style="width:100%">
          <p style="font-weight:800;font-size:18px">${esc(t('player.tenseNow'))}</p>
          ${this.before ? `<p class="small" style="opacity:.8">${esc(t('player.beforeWas', { n: this.before }))}</p>` : ''}
          <div class="scale" role="group" aria-label="${esc(t('player.tensionAria'))}">${scaleButtons(this.after, 'after')}</div>
          <div class="scale-ends"><span>${esc(t('player.loose'))}</span><span>${esc(t('player.locked'))}</span></div>
        </div>` : ''}
        <p style="font-weight:800">${esc(t('player.howFeel'))}</p>
        <div class="chips" style="justify-content:center">${feel}</div>
        <label class="sr" for="p-note">${esc(t('player.note'))}</label>
        <textarea id="p-note" class="input" placeholder="${esc(t('player.notePh'))}"></textarea>
        <button class="btn btn-lg btn-wide" data-p="save">${icon('check')} ${esc(t('player.save'))}</button>
        <button class="link-btn" data-p="discard" style="color:inherit">${esc(t('player.dontSave'))}</button>
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
      ...(this.opts.exId ? { exId: this.opts.exId } : {}),
      ...(this.opts.focus ? { focus: this.opts.focus } : {}),
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
    stopAmbient(0.6);
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
 * @param opts {title, color, items: [{id, sec}], source, routineId, exId, focus, programDay, scale, stuck}
 */
export function startSession(app, opts) {
  if (app.player) app.player.close();
  app.player = new Player(app, opts);
  return app.player;
}
