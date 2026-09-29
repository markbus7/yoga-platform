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
import { t, lang, setLang } from './i18n.js';
import { ROUTINE } from './data/routines.js';
import { EXERCISE } from './data/exercises.js';
import { REST_POSES } from './figure/poses.js';

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
    // Toe spreaders: the timeline says when to put them in and take them out.
    this.spreaders = !!app.store.state.profile.spreaders;
    this.steps = buildTimeline(opts.items, { scale: opts.scale ?? s.hold, transition: s.transition, spreaders: this.spreaders });
    this.planned = timelineSeconds(this.steps);
    this.poseSteps = this.steps.map((st, i) => (st.type === 'pose' ? i : -1)).filter((i) => i >= 0);
    this.exCount = this.steps.filter((st) => st.type === 'move').length;
    this.hasSpreaders = this.steps.some((st) => st.gear === 'on');
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
    // Side by side (landscape): centre the figure; stacked: keep it low, near the timer.
    this.wide = typeof matchMedia === 'function' ? matchMedia('(orientation: landscape) and (min-width: 600px) and (max-height: 820px)') : null;
    this.onWide = () => {
      if (this.figure) this.figure.setAlign(this.figAlign());
    };
    if (this.wide && this.wide.addEventListener) this.wide.addEventListener('change', this.onWide);
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
      <div class="player-top"><button class="icon-btn" data-p="quit" aria-label="${esc(t('player.close'))}">${icon('close')}</button><div class="grow">${esc(this.titleNow())}</div>${this.langBtn()}</div>
      <div class="player-done">
        <span class="kicker">${esc(t('player.before'))}</span>
        <h2>${esc(t('player.howTense'))}</h2>
        <div class="stack" style="width:100%">
          <div class="scale" role="group" aria-label="${esc(t('player.tensionAria'))}">${scaleButtons(this.before, 'before')}</div>
          <div class="scale-ends"><span>${esc(t('player.loose'))}</span><span>${esc(t('player.locked'))}</span></div>
        </div>
        ${this.hasSpreaders ? `<p class="gear-note">${icon('foot')}<span>${esc(t('player.spreadersTip'))}</span></p>` : ''}
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
        ${this.langBtn()}
        <button class="icon-btn" data-p="howto" aria-label="${esc(t('player.howTo'))}" title="${esc(t('player.howTo'))}">${icon('info')}</button>
        ${speechAvailable() ? `<button class="icon-btn" data-p="replay" aria-label="${esc(t('player.replay'))}" title="${esc(t('player.replay'))}">${icon('replay')}</button>` : ''}
        <button class="icon-btn" data-p="sound" aria-label="${esc(t(this.muted ? 'player.soundOff' : 'player.sound'))}" aria-pressed="${!this.muted}">${icon(this.muted ? 'mute' : 'volume')}</button>
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
          <span class="gear" data-r="gear" hidden>${icon('foot')}<span data-r="geartext"></span></span>
          <h2 data-r="name" aria-live="polite"></h2>
          <div class="clock" data-r="clock" aria-hidden="true"></div>
          <p class="cue" data-r="cue"></p>
          <div class="controls">
            <button class="ctl" data-p="prev" aria-label="${esc(t('player.goBack'))}"><span class="icon-btn">${icon('prev')}</span><span class="ctl-label" aria-hidden="true">${esc(t('player.redo'))}</span></button>
            <button class="icon-btn play" data-p="toggle" aria-label="${esc(t('player.pause'))}">${icon('pause')}</button>
            <button class="ctl" data-p="next" aria-label="${esc(t('player.skip'))}"><span class="icon-btn">${icon('next')}</span><span class="ctl-label" aria-hidden="true">${esc(t('player.skipShort'))}</span></button>
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

  go(index, quiet = false, how = '') {
    this.i = index;
    this.elapsed = 0;
    this.spoken = new Set();
    this.cueIdx = -1;
    if (index >= this.steps.length) return this.finish();
    const st = this.steps[index];
    if (st.type === 'move' && this.demoFor.has(st.ex.id) && !this.demoShown.has(st.ex.id)) return this.showDemo(index);
    this.showStep(quiet, how);
  }

  /**
   * Put the current step on screen, and (unless `quiet`) announce it.
   * `how` is 'again' after the back button and 'skipped' after skipping.
   */
  showStep(quiet = false, how = '') {
    const index = this.i;
    const st = this.steps[index];
    const ex = st.ex;
    const rest = st.type === 'rest';
    const isBreath = ex.kind === 'breath';
    const nextMove = this.steps.slice(index + 1).find((x) => x.type === 'move');

    // text
    const exNum = this.steps.slice(0, index + 1).filter((x) => x.type === 'move').length;
    this.set('count', t('player.count', { n: exNum, total: this.exCount }));
    this.set('name', rest ? t('player.restTitle') : ex.name);
    this.r.kicker.textContent = t(rest ? 'player.rest' : st.type === 'move' ? (st.first ? 'player.firstUp' : 'player.nextUp') : st.type === 'switch' ? 'player.switch' : isBreath ? 'player.breathe' : ex.kind === 'flow' ? 'player.moveSlowly' : 'player.hold');
    const side = rest ? '' : st.type === 'pose' && ex.sides ? ex.sideLabels[st.side] : st.type === 'switch' ? ex.sideLabels[1] : st.type === 'move' && ex.sides ? ex.sideLabels[0] : '';
    this.r.side.hidden = !side;
    this.r.side.textContent = side;
    let nextUp = '';
    if (rest) nextUp = t('player.next', { name: st.next.name });
    else if (st.type === 'pose' && ex.sides && st.side === 0) nextUp = t('player.otherSide');
    else if (st.type === 'pose') nextUp = nextMove ? t('player.next', { name: nextMove.ex.name }) : t('player.lastOne');
    this.r.nextup.textContent = nextUp;
    this.showCue(rest ? this.restCue(st) : st.type === 'move' ? ex.setup.join(' ') : st.type === 'switch' ? t('player.switchCue') : ex.cues[0]);
    const gear = st.gear === 'on' ? 'player.gearOn' : st.gear === 'off' ? 'player.gearOff' : st.type === 'move' && st.spreadersIn ? 'player.spreaders' : '';
    this.r.gear.hidden = !gear;
    if (gear) this.r.geartext.textContent = t(gear);

    // figure (a resting figure between exercises) or breathing orb
    this.r.orbwrap.hidden = !(isBreath && st.type === 'pose');
    this.r.fig.style.visibility = isBreath && st.type === 'pose' ? 'hidden' : 'visible';
    const mirror = !rest && ((st.type === 'pose' && st.side === 1) || st.type === 'switch');
    const mode = st.type === 'pose' || rest ? 'hold' : 'enter';
    const enterSec = Math.max(2, Math.min(st.sec - 1.5, 4));
    const spec = rest ? REST_POSES[ex.position] || REST_POSES.back : figureFor(ex, this.spreaders, viewOf(this.app, ex));
    const pickKey = rest || (isBreath && st.type === 'pose') ? '' : `${ex.id}:${viewOf(this.app, ex)}`;
    if (this.pickKey !== pickKey) {
      this.pickKey = pickKey;
      this.r.views.innerHTML = pickKey ? viewPick(ex, viewOf(this.app, ex), 'data-p') : '';
    }
    if (!this.figure) this.figure = mountFigure(this.r.fig, spec, { mode, mirror, enterSec, label: rest ? t('player.restTitle') : ex.name, align: this.figAlign() });
    else if (this.figSpec !== spec) this.figure.setSpec(spec, { mode, mirror, enterSec });
    else {
      this.figure.setMirror(mirror);
      this.figure.setMode(mode, { enterSec, restart: st.type !== 'pose' || ex.kind === 'hold' });
    }
    this.figSpec = spec;
    if (this.paused) this.figure.pause();

    // segments
    this.segEls.forEach((el, k) => {
      const done = this.poseSteps[k] < index;
      el.classList.toggle('done', done);
      el.firstChild.style.width = done ? '100%' : '0';
    });

    // sound: a falling tone when an exercise ends, a soft one for "next up",
    // ticks for 3-2-1 (see timedCues) and a rising tone when the hold starts
    if (!quiet && this.sound) {
      const vol = this.app.store.state.settings.volume;
      const gearSay = st.gear === 'on' ? t('say.gearOn') : st.gear === 'off' ? t('say.gearOff') : '';
      if (rest) {
        if (this.chimes) chime('end', vol);
        if (this.voice) speak([t('say.release'), ex.exit || t('say.comeOut'), gearSay].filter(Boolean).join(' '), this.voiceOpts());
      } else if (st.type === 'move') {
        if (this.chimes) chime('next', vol);
        const line = how === 'again' ? t('say.again', { text: ex.say }) : t(st.first ? 'say.first' : 'say.next', { text: ex.say });
        if (this.voice) speak([how === 'skipped' ? t('say.skipped') : '', line, gearSay].filter(Boolean).join(' '), this.voiceOpts());
      } else if (st.type === 'switch') {
        if (this.chimes) chime('end', vol);
        if (this.voice) speak(t('say.switch', { side: ex.sideLabels[1] }), this.voiceOpts());
      } else if (this.chimes) chime('start', vol);
    }
    this.paint(true);
  }

  /** What to do while resting: how to rest where you are, or the toe spreaders. */
  restCue(st) {
    if (st.gear === 'on') return t('player.gearOnCue');
    if (st.gear === 'off') return t('player.gearOffCue');
    return t('rest.' + st.ex.position);
  }

  titleNow() {
    const { routineId, exId, title } = this.opts;
    if (routineId && ROUTINE[routineId]) return ROUTINE[routineId].name;
    if (exId && EXERCISE[exId]) return EXERCISE[exId].name;
    return title;
  }

  langBtn() {
    const other = lang() === 'nl' ? 'en' : 'nl';
    return `<button class="icon-btn lang-btn" data-p="lang" lang="${other}" aria-label="${esc(t('player.langSwitch'))}" title="${esc(t('player.langSwitch'))}">${other.toUpperCase()}</button>`;
  }

  /** Switch between English and Dutch mid-session, keeping your place and the clock. */
  switchLang() {
    const next = lang() === 'nl' ? 'en' : 'nl';
    setLang(next);
    this.app.store.update((s) => {
      s.settings.lang = next;
    });
    stopSpeaking();
    this.el.setAttribute('aria-label', this.titleNow());
    if (this.phase === 'checkin') return this.showCheckin();
    if (this.phase === 'done') {
      const note = (this.el.querySelector('#p-note') || {}).value || '';
      this.renderDone();
      const box = this.el.querySelector('#p-note');
      if (box) box.value = note;
      return;
    }
    if (this.phase !== 'run') return;
    const { i, elapsed } = this;
    const learning = this.learning;
    const resume = this.learnResume;
    const wasPlaying = this.wasPlaying;
    const waiting = learning !== null && !resume && !this.autoTimer;
    clearTimeout(this.autoTimer);
    this.learning = null;
    this.learnFig = null;
    this.renderRun();
    this.cache = {};
    this.pickKey = null;
    this.i = i;
    this.showStep(true);
    this.elapsed = elapsed;
    this.paint();
    this.syncToggle();
    if (learning !== null) {
      this.showDemo(learning, { resume });
      this.wasPlaying = wasPlaying;
      if (waiting) this.stopAuto();
    }
  }

  /** Make the play/pause button and the figure match `this.paused`. */
  syncToggle() {
    const btn = this.el.querySelector('[data-p="toggle"]');
    if (btn) {
      btn.innerHTML = icon(this.paused ? 'play' : 'pause');
      btn.setAttribute('aria-label', t(this.paused ? 'player.resume' : 'player.pause'));
    }
    if (this.figure) {
      if (this.paused) this.figure.pause();
      else this.figure.play();
    }
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
    const gear = this.gearNote(st);
    const tip = (label, text) => (text ? `<div class="learn-tip"><b>${esc(label)}</b> ${esc(text)}</div>` : '');
    const box = document.createElement('div');
    box.className = 'learn';
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', t('learn.title'));
    box.innerHTML = `
      <div class="player-top">
        <button class="icon-btn" data-p="close" aria-label="${esc(t('player.end'))}">${icon('close')}</button>
        <div class="grow">${esc(t('player.count', { n: exNum, total: this.exCount }))}</div>
        ${this.langBtn()}
      </div>
      <div class="learn-main">
        <div class="learn-visual">
          ${viewPick(ex, viewOf(this.app, ex), 'data-p')}
          <div class="learn-fig" data-learn-fig></div>
        </div>
        <div class="learn-side">
          <div class="learn-text">
            ${gear ? `<p class="gear-note">${icon('foot')}<span>${esc(t(gear))}</span></p>` : ''}
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
            ${resume ? '' : `<div class="learn-auto" data-auto><span class="auto-bar" aria-hidden="true"><i></i></span><span class="small">${esc(t('learn.auto'))}</span><button class="link-btn" data-p="learn-wait" style="color:inherit">${esc(t('learn.wait'))}</button></div>`}
            <div class="learn-links">
              ${resume ? '' : `<button class="link-btn" data-p="learn-known" style="color:inherit">${esc(t('learn.known'))}</button>`}
              <button class="link-btn" data-p="learn-skip" style="color:inherit">${esc(t('learn.skip'))}</button>
            </div>
          </div>
        </div>
      </div>`;
    this.el.appendChild(box);
    this.learnFig = mountFigure(box.querySelector('[data-learn-fig]'), figureFor(ex, this.spreaders, viewOf(this.app, ex)), { mode: 'preview', label: ex.name, align: 'middle' });
    box.querySelector('h2').focus({ preventScroll: true });
    // Some browsers scroll to the focused title anyway; start the text at the top.
    box.querySelector('.learn-text').scrollTop = 0;
    this.syncAmbient();
    if (this.sound && this.voice) this.sayHowTo(ex, st);
    if (!resume) this.autoContinue(box, ex);
  }

  /**
   * Carry on without a tap: enough time to hear (or read) the steps and get
   * into place, shown as a slowly filling bar. "Wait" stops it.
   */
  autoContinue(box, ex) {
    clearTimeout(this.autoTimer);
    const words = [ex.name, ...ex.setup].join(' ').length;
    const ms = Math.max(14000, words * 75) + 10000;
    const bar = box.querySelector('.auto-bar i');
    if (bar) {
      bar.style.transition = `width ${ms}ms linear`;
      requestAnimationFrame(() => requestAnimationFrame(() => (bar.style.width = '100%')));
    }
    const index = this.learning;
    this.autoTimer = setTimeout(() => {
      if (this.learning === index && !this.el.querySelector('.confirm')) this.endDemo();
    }, ms);
  }

  stopAuto() {
    clearTimeout(this.autoTimer);
    this.autoTimer = 0;
    const auto = this.el.querySelector('[data-auto]');
    if (auto) auto.innerHTML = `<span class="small">${esc(t('learn.waiting'))}</span>`;
  }

  /** The toe-spreader note for a move step: put them in now, take them out, or keep them in. */
  gearNote(st) {
    if (st.type !== 'move') return '';
    if (st.gear === 'on') return 'player.gearOn';
    if (st.gear === 'off') return 'player.gearOff';
    return st.spreadersIn ? 'player.spreaders' : '';
  }

  endDemo(known = false) {
    const index = this.learning;
    if (index === null) return;
    clearTimeout(this.autoTimer);
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
    if (this.sound && this.voice) speak(t('say.getReady'), this.voiceOpts());
    if (this.paused) this.toggle();
  }

  /** From the how-to: leave this exercise out and carry on with the next one. */
  skipFromDemo() {
    const index = this.learning;
    if (index === null) return;
    clearTimeout(this.autoTimer);
    this.demoShown.add(this.steps[index].ex.id);
    stopSpeaking();
    const box = this.el.querySelector('.learn');
    if (box) box.remove();
    this.learnFig = null;
    this.learning = null;
    if (!this.learnResume) this.i = index;
    if (this.paused) this.toggle();
    this.skip();
  }

  sayHowTo(ex, st = null) {
    const gear = st && st.gear === 'on' ? t('say.gearOn') : st && st.gear === 'off' ? t('say.gearOff') : '';
    speak([ex.name + '.', gear, ...ex.setup].filter(Boolean).join(' '), this.voiceOpts());
  }

  /** Say the current instruction again (it plays even when the voice is off: you asked). */
  replay() {
    if (this.learning !== null) return this.sayHowTo(this.steps[this.learning].ex, this.steps[this.learning]);
    const st = this.steps[this.i];
    if (!st) return;
    const ex = st.ex;
    if (st.type === 'switch') return speak(t('say.switch', { side: ex.sideLabels[1] }), this.voiceOpts());
    if (st.type === 'rest') return speak([ex.exit || t('say.comeOut'), this.restCue(st)].join(' '), this.voiceOpts());
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

  figAlign() {
    return this.wide && this.wide.matches ? 'middle' : 'bottom';
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
    const left = st.sec - this.elapsed;
    const vol = this.app.store.state.settings.volume;
    // 3, 2, 1: soft ticks just before a hold (or its other side) starts
    if (st.type === 'move' || st.type === 'switch') {
      const k = Math.ceil(left);
      if (k >= 1 && k <= 3 && st.sec >= k + 2 && !this.spoken.has('t' + k)) {
        this.spoken.add('t' + k);
        if (this.sound && this.chimes) chime('tick', vol);
      }
      return;
    }
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
    // ten seconds to go, so you know the end is near without looking
    if (st.sec >= 30 && left <= 10 && !this.spoken.has('ten')) {
      this.spoken.add('ten');
      if (this.sound && this.voice) speak(t('say.tenLeft'), this.voiceOpts());
      else if (this.sound && this.chimes) chime('tick', vol);
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

  /** The move step that starts the exercise on screen; during a rest, the one you just finished. */
  exerciseStart(i = this.i) {
    const ex = this.steps[i] && this.steps[i].ex;
    for (let j = i; j >= 0; j--) if (this.steps[j].type === 'move' && this.steps[j].ex === ex) return j;
    return 0;
  }

  /** Skip the rest of this exercise (both sides) and go on to the next one. */
  skip() {
    let j = this.i + 1;
    while (j < this.steps.length && this.steps[j].type !== 'move') j++;
    // keep a rest that says to put toe spreaders in or out
    if (j < this.steps.length && j - 1 > this.i && this.steps[j - 1].type === 'rest' && this.steps[j - 1].gear) j--;
    this.go(j, false, 'skipped');
  }

  /**
   * Back: do the exercise on screen again from the start (during a rest, the
   * one you just finished). Pressed right at the start of an exercise, it goes
   * back to the one before.
   */
  prev() {
    const m = this.exerciseStart();
    if (this.i === m && this.elapsed <= 3) {
      for (let j = m - 1; j >= 0; j--) if (this.steps[j].type === 'move') return this.go(j, false, 'again');
    }
    this.go(m, false, 'again');
  }

  confirmEnd() {
    if (this.learning !== null) this.stopAuto();
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
    else if (act === 'learn-wait') this.stopAuto();
    else if (act === 'learn-skip') this.skipFromDemo();
    else if (act === 'howto') this.showDemo(this.i, { resume: true });
    else if (act === 'lang') this.switchLang();
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
      // how to come out of the last pose, then well done
      const last = this.steps[this.steps.length - 1];
      const lastMove = [...this.steps].reverse().find((x) => x.type === 'move');
      const gearOff = lastMove && lastMove.spreadersIn ? t('say.gearOff') : '';
      if (this.voice && completed) speak([last && last.ex.exit, gearOff, t('say.done')].filter(Boolean).join(' '), this.voiceOpts());
    }
    this.renderDone();
  }

  renderDone() {
    const completed = this.completed;
    const state = this.app.store.state;
    const today = dayKey();
    const minutes = Math.max(1, Math.round(this.active / 60));
    const poses = Object.keys(this.exSec).length;
    const nextStreak = streak([...state.sessions, { day: today, sec: this.active }], today).days;
    const feel = FEELINGS.map((f) => `<button type="button" class="chip" data-feel="${f}" aria-pressed="${this.feel.has(f)}">${esc(t('feel.' + f))}</button>`).join('');
    this.el.innerHTML = `
      <div class="player-top"><span style="width:44px"></span><div class="grow">${esc(this.titleNow())}</div>${this.langBtn()}</div>
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
    clearTimeout(this.autoTimer);
    this.phase = 'closed';
    stopAmbient(0.6);
    if (this.wide && this.wide.removeEventListener) this.wide.removeEventListener('change', this.onWide);
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
