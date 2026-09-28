// Calm background sound for sessions, synthesised on the spot (no files):
// slow waves, soft rain or a warm hum. It dips while the voice speaks.

import { audioCtx, onSpeech } from './audio.js';

const DUCK = 0.22; // share of the volume left while the voice speaks
let bed = null; // the sound that is playing: { kind, out, stop() }
let level = 0.5;
let paused = false;
let ducked = false;
let previewTimer = 0;

/** A few seconds of noise to loop. Brown noise is deep and soft, pink is brighter. */
function noise(ctx, color, seconds = 8) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let last = 0;
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (color === 'brown') {
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.5;
      } else {
        b0 = 0.99765 * b0 + w * 0.099046;
        b1 = 0.963 * b1 + w * 0.2965164;
        b2 = 0.57 * b2 + w * 1.0526913;
        d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.11;
      }
    }
    // Fade the loop point so it does not click.
    const f = Math.floor(ctx.sampleRate * 0.01);
    for (let i = 0; i < f; i++) {
      const k = i / f;
      d[i] *= k;
      d[len - 1 - i] *= k;
    }
  }
  return buf;
}

function loop(ctx, buf) {
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  return src;
}

function lfo(ctx, hz, depth, target) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.frequency.value = hz;
  g.gain.value = depth;
  o.connect(g);
  g.connect(target);
  return o;
}

/** Surf rolling in and out about every nine seconds: roughly a slow, relaxed breath. */
function waves(ctx, out) {
  const sources = [];
  const body = loop(ctx, noise(ctx, 'brown'));
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 520;
  const bodyGain = ctx.createGain();
  bodyGain.gain.value = 0.42;
  body.connect(lp);
  lp.connect(bodyGain);
  bodyGain.connect(out);

  const foam = loop(ctx, noise(ctx, 'pink'));
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 2200;
  bp.Q.value = 0.6;
  const foamGain = ctx.createGain();
  foamGain.gain.value = 0.05;
  foam.connect(bp);
  bp.connect(foamGain);
  foamGain.connect(out);

  const swell = 0.11;
  sources.push(body, foam, lfo(ctx, swell, 0.34, bodyGain.gain), lfo(ctx, swell, 0.045, foamGain.gain), lfo(ctx, swell, 300, lp.frequency));
  // a slower second swell so no two waves are quite the same
  sources.push(lfo(ctx, 0.037, 0.12, bodyGain.gain));
  return sources;
}

/** Steady, soft rain. */
function rain(ctx, out) {
  const src = loop(ctx, noise(ctx, 'pink'));
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 500;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 5200;
  const g = ctx.createGain();
  g.gain.value = 0.6;
  src.connect(hp);
  hp.connect(lp);
  lp.connect(g);
  g.connect(out);
  const low = loop(ctx, noise(ctx, 'brown'));
  const lg = ctx.createGain();
  lg.gain.value = 0.3;
  low.connect(lg);
  lg.connect(out);
  return [src, low, lfo(ctx, 0.05, 0.1, g.gain)];
}

/** A warm, slowly breathing chord (C major, in tune with the chimes). */
function hum(ctx, out) {
  const sources = [];
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 900;
  lp.connect(out);
  const notes = [65.41, 98, 130.81, 164.81, 196];
  notes.forEach((f, i) => {
    const g = ctx.createGain();
    g.gain.value = i === 0 ? 0.07 : 0.042;
    g.connect(lp);
    for (const cents of [-3, 3]) {
      const o = ctx.createOscillator();
      o.type = i % 2 ? 'triangle' : 'sine';
      o.frequency.value = f;
      o.detune.value = cents;
      o.connect(g);
      sources.push(o);
    }
    sources.push(lfo(ctx, 0.04 + i * 0.023, i === 0 ? 0.021 : 0.025, g.gain));
  });
  return sources;
}

const MAKERS = { waves, rain, hum };

/** Build the sound graph for `kind` into `out`; returns the sources to start. */
export function ambientGraph(ctx, kind, out) {
  return MAKERS[kind] ? MAKERS[kind](ctx, out) : [];
}

function target() {
  if (!bed || paused) return 0;
  return level * 0.6 * (ducked ? DUCK : 1);
}

function glide(sec = 1.2) {
  const ctx = audioCtx();
  if (!ctx || !bed) return;
  const g = bed.out.gain;
  const now = ctx.currentTime;
  g.cancelScheduledValues(now);
  g.setValueAtTime(g.value, now);
  g.linearRampToValueAtTime(target(), now + sec);
}

onSpeech((on) => {
  ducked = on;
  glide(on ? 0.4 : 1.6);
});

/**
 * Start a background sound (replacing any that plays). Call after a tap has
 * unlocked audio. `volume` is 0 to 1.
 */
export function startAmbient(kind, volume = 0.5) {
  clearTimeout(previewTimer);
  const ctx = audioCtx();
  if (bed && bed.kind === kind) {
    level = volume;
    paused = false;
    glide(2);
    return;
  }
  stopAmbient(0.8);
  if (!ctx || !MAKERS[kind]) return;
  try {
    const out = ctx.createGain();
    out.gain.value = 0;
    out.connect(ctx.destination);
    const sources = ambientGraph(ctx, kind, out);
    const t = ctx.currentTime + 0.02;
    for (const s of sources) s.start(t);
    bed = {
      kind,
      out,
      stop(at) {
        for (const s of sources) {
          try {
            s.stop(at);
          } catch {
            /* already stopped */
          }
        }
        setTimeout(() => out.disconnect(), Math.max(0, (at - ctx.currentTime) * 1000) + 200);
      },
    };
    level = volume;
    paused = false;
    glide(3);
  } catch {
    bed = null;
  }
}

export function setAmbientVolume(volume) {
  level = volume;
  glide(0.3);
}

/** Fade out while a session is paused; `resumeAmbient` fades back in. */
export function pauseAmbient() {
  paused = true;
  glide(1);
}

export function resumeAmbient() {
  paused = false;
  glide(1.5);
}

export function stopAmbient(fadeSec = 1.5) {
  clearTimeout(previewTimer);
  const ctx = audioCtx();
  if (!bed || !ctx) {
    bed = null;
    return;
  }
  const old = bed;
  bed = null;
  const now = ctx.currentTime;
  const g = old.out.gain;
  g.cancelScheduledValues(now);
  g.setValueAtTime(g.value, now);
  g.linearRampToValueAtTime(0, now + fadeSec);
  old.stop(now + fadeSec + 0.05);
}

/** Play a few seconds so you can hear what you picked in Settings. */
export function previewAmbient(kind, volume = 0.5, seconds = 6) {
  if (kind === 'off') return stopAmbient(0.6);
  startAmbient(kind, volume);
  previewTimer = setTimeout(() => stopAmbient(2), seconds * 1000);
}

export function ambientPlaying() {
  return !!bed;
}
