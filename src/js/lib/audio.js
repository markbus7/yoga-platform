// Soft bell chimes (synthesised, no files) and spoken cues.

let ctx = null;

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

/** kinds: 'start' (a pose begins), 'next' (get ready), 'switch', 'done' */
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
    if (kind === 'start') bell(523.25, 0);
    else if (kind === 'next') bell(392, 0, 0.75);
    else if (kind === 'switch') bell(440, 0, 0.8);
    else if (kind === 'done') {
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

/** English voices, best-sounding first. */
export function englishVoices() {
  if (!speechAvailable()) return [];
  const all = speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang));
  const score = (v) => (/natural|neural|premium|enhanced/i.test(v.name) ? 3 : 0) + (/google|samantha|daniel|serena|karen|moira|aria|jenny|guy|libby|ryan/i.test(v.name) ? 2 : 0) + (v.localService ? 1 : 0);
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

export function speak(text, { voiceURI = '', rate = 1 } = {}) {
  if (!speechAvailable() || !text) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voices = englishVoices();
    const v = voices.find((x) => x.voiceURI === voiceURI) || voices[0];
    if (v) {
      u.voice = v;
      u.lang = v.lang;
    } else u.lang = 'en-GB';
    u.rate = rate * 0.95;
    u.pitch = 1;
    speechSynthesis.speak(u);
  } catch {
    /* speech failed; the screen still shows the cue */
  }
}

export function stopSpeaking() {
  if (!speechAvailable()) return;
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
