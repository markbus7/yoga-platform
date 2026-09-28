// Soft bell chimes (synthesised, no files) and spoken cues.

let ctx = null;

/** The shared AudioContext once a tap has unlocked sound, else null. */
export function audioCtx() {
  return ctx;
}

// Told when the voice starts and stops, so background sound can dip under it.
let speechListener = null;
let speechTimer = 0;
let current = null;
export function onSpeech(fn) {
  speechListener = fn;
}
function speaking(on, text = '') {
  clearTimeout(speechTimer);
  if (speechListener) speechListener(on);
  // Some browsers never report the end of an utterance; give up after a while.
  if (on) speechTimer = setTimeout(() => speaking(false), 1500 + text.length * 90);
}

/** Call from a tap: browsers only allow sound after the viewer interacts. */
export function unlockAudio() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!ctx && AC) ctx = new AC();
    if (ctx && ctx.state === 'suspended') ctx.resume();
  } catch {
    ctx = null;
  }
  try {
    if ('speechSynthesis' in window) {
      // An empty utterance inside the tap lets later cues play on iOS.
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      speechSynthesis.speak(u);
    }
  } catch {
    /* speech not available */
  }
}

/**
 * kinds: 'start' (a hold begins: two rising notes), 'end' (it is over, come
 * out: two falling notes; 'switch' is the same), 'next' (a soft note: the next
 * exercise is coming), 'tick' (3-2-1 before a start), 'done' (session over)
 */
export function chime(kind = 'start', volume = 0.7) {
  if (!ctx || volume <= 0) return;
  try {
    const t = ctx.currentTime + 0.02;
    const out = ctx.createGain();
    out.gain.value = volume;
    out.connect(ctx.destination);
    const tone = (freq, start, dur, gain) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t + start);
      g.gain.exponentialRampToValueAtTime(gain, t + start + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + start + dur);
      o.connect(g);
      g.connect(out);
      o.start(t + start);
      o.stop(t + start + dur + 0.05);
    };
    // A small singing-bowl: fundamental plus two inharmonic partials.
    const bell = (f, start, amp = 1) => {
      tone(f, start, 3.2, 0.3 * amp);
      tone(f * 2.76, start, 1.8, 0.1 * amp);
      tone(f * 5.4, start, 0.9, 0.04 * amp);
    };
    if (kind === 'start') {
      bell(392, 0, 0.8);
      bell(523.25, 0.18);
    } else if (kind === 'end' || kind === 'switch') {
      bell(523.25, 0, 0.9);
      bell(392, 0.22, 0.85);
    } else if (kind === 'next') bell(659.25, 0, 0.5);
    else if (kind === 'tick') {
      tone(1318.5, 0, 0.09, 0.08);
      tone(2637, 0, 0.05, 0.025);
    } else if (kind === 'done') {
      bell(392, 0);
      bell(523.25, 0.4);
      bell(659.25, 0.8);
    }
  } catch {
    /* audio failed; stay silent */
  }
}

export function speechAvailable() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

const GOOD_VOICES = /google|samantha|daniel|serena|karen|moira|aria|jenny|guy|libby|ryan|xander|claire|ellen|fenna|maarten|colette|arnaud|dena/i;

/** Voices for a language ('en' or 'nl'), best-sounding first. */
export function voicesFor(lang = 'en') {
  if (!speechAvailable()) return [];
  const prefix = new RegExp('^' + lang, 'i');
  const all = speechSynthesis.getVoices().filter((v) => prefix.test(v.lang));
  const score = (v) =>
    (/natural|neural|premium|enhanced/i.test(v.name) ? 3 : 0) +
    (GOOD_VOICES.test(v.name) ? 2 : 0) +
    (v.localService ? 1 : 0) +
    (/^nl-NL|^en-GB/i.test(v.lang) ? 0.5 : 0);
  return all.sort((a, b) => score(b) - score(a));
}

export function onVoicesChanged(fn) {
  if (!speechAvailable()) return;
  try {
    speechSynthesis.addEventListener('voiceschanged', fn);
  } catch {
    /* older browsers */
  }
}

export function speak(text, { voiceURI = '', rate = 1, lang = 'en' } = {}) {
  if (!speechAvailable() || !text) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voices = voicesFor(lang);
    const v = voices.find((x) => x.voiceURI === voiceURI) || voices[0];
    if (v) {
      u.voice = v;
      u.lang = v.lang;
    } else u.lang = lang === 'nl' ? 'nl-NL' : 'en-GB';
    u.rate = rate * 0.95;
    u.pitch = 1;
    // A cancelled utterance reports its end after the next one has started.
    const done = () => {
      if (current === u) speaking(false);
    };
    u.onend = done;
    u.onerror = done;
    current = u;
    speaking(true, text);
    speechSynthesis.speak(u);
  } catch {
    /* speech failed; the screen still shows the cue */
  }
}

export function stopSpeaking() {
  if (!speechAvailable()) return;
  current = null;
  speaking(false);
  try {
    speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}

// ---------- keep the screen on during a session ----------

let lock = null;
let wantLock = false;

async function acquire() {
  try {
    if (navigator.wakeLock && document.visibilityState === 'visible') {
      lock = await navigator.wakeLock.request('screen');
      lock.addEventListener('release', () => {
        lock = null;
      });
    }
  } catch {
    lock = null;
  }
}

export function keepAwake(on) {
  wantLock = on;
  if (on) acquire();
  else if (lock) {
    lock.release().catch(() => {});
    lock = null;
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (wantLock && document.visibilityState === 'visible' && !lock) acquire();
  });
}
