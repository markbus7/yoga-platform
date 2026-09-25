// Keyframes for every exercise figure. See rig.js for the angle conventions.
// Hold figures run setup -> final; flow figures loop through their frames.

// ---- side-view building blocks ----
const QUAD = {
  lumbar: -7, thorax: -8, neck: -14, head: -10,
  thighN: 90, shinN: 180, footN: 180, thighF: 88, shinF: 180, footF: 180,
  uarmN: 90, farmN: 90, handN: 0, uarmF: 87, farmF: 88, handF: 0,
};
const SUPINE = {
  lumbar: 180, thorax: 180, neck: 178, head: 180,
  thighN: 2, shinN: 1, footN: -80, thighF: 3, shinF: 2, footF: -78,
  uarmN: 12, farmN: 3, handN: 0, uarmF: 14, farmF: 4, handF: 0,
};
const KNEES_UP = { thighN: -52, shinN: 68, footN: 0, thighF: -50, shinF: 70, footF: 0 };
const CHAIR_SIDE = {
  thighN: -2, shinN: 90, footN: 5, thighF: 0, shinF: 92, footF: 5,
  uarmN: 96, farmN: 30, handN: 20, uarmF: 94, farmF: 28, handF: 20,
};
const LUNGE_LEGS = { thighN: -2, shinN: 90, footN: 2, thighF: 118, shinF: 180, footF: 180 };
const FEET = ['ankleN', 'toeN', 'ankleF', 'toeF'];

// ---- front-view building blocks ----
const CHAIR_FRONT = {
  thighL: 100, thighR: 80, shinL: 92, shinR: 88,
  sc: { thighL: 0.28, thighR: 0.28 },
  uarmL: 96, farmL: 86, handL: 86, uarmR: 84, farmR: 94, handR: 94,
};
const CROSS = {
  thighR: -4, shinR: 170, footR: 150, thighL: 184, shinL: 10, footL: 30,
  sc: { thighR: 0.8, thighL: 0.8, footR: 0.45, footL: 0.45 },
  uarmR: 74, farmR: 98, handR: 98, uarmL: 106, farmL: 82, handL: 82,
};
const FRONT_FEET = ['ankleL', 'toeL', 'ankleR', 'toeR'];

export const POSES = {
  // ---------- standing & moving ----------
  reach: {
    flow: true, pingpong: true, beat: 2.4, pause: 0.7,
    groundOn: FEET,
    frames: [
      {},
      { thorax: -93, neck: -97, head: -103, uarmN: -94, farmN: -96, handN: -96, uarmF: -91, farmF: -93, handF: -93 },
    ],
    glow: ['thorax', 'uarmN'],
  },
  rolldown: {
    flow: true, pingpong: true, beat: 2.3, pause: 0.5,
    groundOn: FEET, anchor: 'ankleN',
    frames: [
      {},
      { thorax: -80, neck: -42, head: -8 },
      { lumbar: -66, thorax: -8, neck: 28, head: 60, thighN: 86, shinN: 94, thighF: 87, shinF: 94 },
      { lumbar: 30, thorax: 66, neck: 86, head: 94, thighN: 74, shinN: 101, footN: 4, thighF: 75, shinF: 101, footF: 4, uarmN: 118, farmN: 132, handN: 140, uarmF: 120, farmF: 134, handF: 142 },
    ],
    glow: ['lumbar', 'thorax', 'thighN'],
  },
  ragdoll: {
    groundOn: FEET, anchor: 'ankleN', beat: 2.8,
    frames: [
      { thighN: 88, shinN: 92, thighF: 89, shinF: 92 },
      { lumbar: 36, thorax: 72, neck: 90, head: 96, thighN: 74, shinN: 101, footN: 4, thighF: 75, shinF: 101, footF: 4, uarmN: 102, farmN: 188, handN: 188, uarmF: 98, farmF: 184, handF: 184, sc: { farmN: 0.5, farmF: 0.5, handN: 0.6, handF: 0.6 } },
    ],
    glow: ['thighN', 'lumbar'],
  },
  foldtest: {
    groundOn: FEET, anchor: 'ankleN',
    frames: [
      {},
      { lumbar: 20, thorax: 56, neck: 80, head: 90, uarmN: 124, farmN: 138, handN: 148, uarmF: 126, farmF: 140, handF: 150 },
    ],
    glow: ['thighN'],
  },
  armcircles: {
    flow: true, beat: 1.05, pause: 0, still: 2,
    groundOn: FEET,
    frames: [
      { uarmN: 90, farmN: 90, handN: 90, uarmF: 92, farmF: 92, handF: 92 },
      { uarmN: 0, farmN: 0, handN: 0, uarmF: 3, farmF: 3, handF: 3 },
      { uarmN: -90, farmN: -90, handN: -90, uarmF: -88, farmF: -88, handF: -88 },
      { uarmN: -180, farmN: -180, handN: -180, uarmF: -178, farmF: -178, handF: -178 },
    ],
    glow: ['uarmN'],
  },
  clasp: {
    groundOn: FEET,
    frames: [
      {},
      { thorax: -97, neck: -101, head: -106, uarmN: 128, farmN: 134, handN: 134, uarmF: 126, farmF: 132, handF: 132 },
    ],
    glow: ['thorax', 'uarmN'],
  },
  wrist: {
    flow: true, pingpong: true, beat: 1.2, pause: 2.4,
    groundOn: FEET,
    frames: [
      { uarmN: 0, farmN: 0, handN: -84, uarmF: 4, farmF: 6, handF: -60 },
      { uarmN: 0, farmN: 0, handN: 84, uarmF: 8, farmF: 20, handF: 60 },
    ],
    glow: ['farmN'],
  },
  calf: {
    groundOn: FEET, anchor: 'ankleF',
    frames: [
      { lumbar: -84, thorax: -82, thighN: 78, shinN: 100, footN: 0, thighF: 104, shinF: 104, footF: 0, uarmN: -2, farmN: -4, handN: -80, uarmF: 0, farmF: -2, handF: -78 },
      { lumbar: -74, thorax: -70, neck: -74, head: -78, thighN: 70, shinN: 106, footN: 0, thighF: 113, shinF: 113, footF: 2, uarmN: -4, farmN: -6, handN: -82, uarmF: -2, farmF: -4, handF: -80 },
    ],
    props: [{ t: 'wall', at: 'wristN', side: 'right' }],
    glow: ['shinF'],
  },
  quad: {
    groundOn: ['ankleF', 'toeF'], anchor: 'ankleF',
    frames: [
      { uarmF: -8, farmF: -4, handF: -80 },
      { thighN: 94, shinN: -106, footN: -160, uarmN: 106, farmN: 118, handN: 150, uarmF: -8, farmF: -4, handF: -80 },
    ],
    props: [{ t: 'wall', at: 'wristF', side: 'right' }],
    glow: ['thighN'],
  },
  squat: {
    anchor: 'ankleN', beat: 2.8,
    frames: [
      {},
      { lumbar: -72, thorax: -80, neck: -84, head: -86, thighN: -15, shinN: 115, footN: 0, thighF: -13, shinF: 116, footF: 0, uarmN: 52, farmN: -48, handN: -62, uarmF: 54, farmF: -46, handF: -60 },
    ],
    props: [{ t: 'block', under: 'hip', w: 23 }],
    glow: ['thighN', 'shinN'],
  },
  squattest: {
    anchor: 'ankleN', groundOn: FEET,
    frames: [
      {},
      { lumbar: -72, thorax: -80, neck: -84, head: -86, thighN: -15, shinN: 115, footN: 0, thighF: -13, shinF: 116, footF: 0, uarmN: 52, farmN: -48, handN: -62, uarmF: 54, farmF: -46, handF: -60 },
    ],
    glow: ['shinN'],
  },

  // ---------- all fours & kneeling ----------
  catcow: {
    flow: true, pingpong: true, beat: 2.8, pause: 0.5,
    anchor: 'kneeN',
    frames: [
      { ...QUAD, lumbar: 12, thorax: -22, neck: -38, head: -50 },
      { ...QUAD, lumbar: -25, thorax: 10, neck: 48, head: 70 },
    ],
    glow: ['lumbar', 'thorax'],
  },
  thread: {
    anchor: 'kneeN', beat: 2.6,
    frames: [
      QUAD,
      { ...QUAD, lumbar: 24, thorax: 50, neck: 20, head: 12, uarmN: 100, farmN: 115, handN: 120, sc: { uarmN: 0.55, farmN: 0.5 }, uarmF: 17, farmF: 9, handF: 0 },
    ],
    glow: ['thorax', 'uarmN'],
  },
  child: {
    anchor: 'kneeN', beat: 3,
    frames: [
      QUAD,
      { lumbar: 6, thorax: 9, neck: 12, head: 15, thighN: 20, shinN: 180, footN: 180, thighF: 21, shinF: 180, footF: 180, uarmN: 16, farmN: 10, handN: 4, uarmF: 13, farmF: 8, handF: 3 },
    ],
    glow: ['lumbar', 'thorax'],
  },
  puppy: {
    anchor: 'kneeN', beat: 2.8,
    frames: [
      QUAD,
      { lumbar: 35, thorax: 45, neck: 22, head: 15, thighN: 90, shinN: 180, footN: 180, thighF: 88, shinF: 180, footF: 180, uarmN: 12, farmN: 14, handN: 5, uarmF: 10, farmF: 12, handF: 4 },
    ],
    glow: ['thorax', 'uarmN'],
  },
  downdog: {
    anchor: 'wristN', beat: 2.6,
    frames: [
      QUAD,
      { lumbar: 45, thorax: 55, neck: 70, head: 80, thighN: 110, shinN: 125, footN: 40, thighF: 111, shinF: 126, footF: 41, uarmN: 60, farmN: 60, handN: 0, uarmF: 61, farmF: 61, handF: 0 },
    ],
    glow: ['thighN', 'shinN', 'uarmN'],
  },
  lowlunge: {
    anchor: 'ankleN', beat: 2.6,
    frames: [
      { ...LUNGE_LEGS, lumbar: -20, thorax: -10, neck: -14, head: -18, uarmN: 92, farmN: 92, handN: 5, uarmF: 94, farmF: 92, handF: 4 },
      { ...LUNGE_LEGS, lumbar: -80, thorax: -76, neck: -80, head: -84, uarmN: 55, farmN: 55, handN: 60, uarmF: 57, farmF: 57, handF: 62 },
    ],
    glow: ['thighF'],
  },
  lungereach: {
    flow: true, pingpong: true, beat: 2.2, pause: 0.8,
    anchor: 'ankleN',
    frames: [
      { ...LUNGE_LEGS, lumbar: -20, thorax: -5, neck: -10, head: -15, uarmN: 92, farmN: 92, handN: 5, uarmF: 93, farmF: 92, handF: 4 },
      { ...LUNGE_LEGS, lumbar: -22, thorax: -8, neck: -30, head: -55, uarmN: -92, farmN: -94, handN: -94, uarmF: 93, farmF: 92, handF: 4 },
    ],
    glow: ['thighF', 'thorax'],
  },
  halfsplit: {
    anchor: 'kneeF', beat: 2.6,
    frames: [
      { ...LUNGE_LEGS, lumbar: -20, thorax: -10, neck: -14, head: -18, uarmN: 92, farmN: 92, handN: 5, uarmF: 94, farmF: 92, handF: 4 },
      { lumbar: -45, thorax: -25, neck: -20, head: -15, thighN: 31, shinN: 31, footN: -58, thighF: 90, shinF: 180, footF: 180, uarmN: 90, farmN: 90, handN: 0, uarmF: 92, farmF: 90, handF: 0 },
    ],
    props: [
      { t: 'block', under: 'wristN', w: 15, layer: 'near' },
      { t: 'block', under: 'wristF', w: 15, layer: 'far', dx: 4 },
    ],
    glow: ['thighN'],
  },
  pigeon: {
    anchor: 'hip', beat: 3,
    frames: [
      QUAD,
      { lumbar: -84, thorax: -87, neck: -88, head: -88, thighN: 18, shinN: 180, footN: 180, thighF: 165, shinF: 175, footF: 178, uarmN: 94, farmN: 92, handN: 3, uarmF: 96, farmF: 93, handF: 3, sc: { shinN: 0.4, footN: 0.5 } },
    ],
    props: [
      { t: 'block', under: 'hip', w: 23 },
      { t: 'block', under: 'wristN', w: 15, layer: 'front', dx: 3 },
      { t: 'block', under: 'wristF', w: 15, layer: 'far', dx: -3 },
    ],
    glow: ['hip', 'thighN'],
  },

  // ---------- lying on the belly ----------
  sphinx: {
    anchor: 'hip', beat: 2.6,
    frames: [
      { lumbar: -1, thorax: -6, neck: -10, head: -14, thighN: 180, shinN: 180, footN: 180, thighF: 181, shinF: 180, footF: 180, uarmN: 22, farmN: 0, handN: 0, uarmF: 24, farmF: 0, handF: 0 },
      { lumbar: -12, thorax: -35, neck: -70, head: -80, thighN: 180, shinN: 180, footN: 180, thighF: 181, shinF: 180, footF: 180, uarmN: 76, farmN: 0, handN: 0, uarmF: 78, farmF: 0, handF: 0 },
    ],
    glow: ['lumbar'],
  },

  // ---------- lying on the back (side view) ----------
  kneestochest: {
    flow: true, pingpong: true, beat: 2.4, pause: 0.6,
    anchor: 'hip',
    frames: [
      { ...SUPINE, thighN: -118, shinN: -4, footN: -60, thighF: -116, shinF: -2, footF: -58, uarmN: -56, farmN: -34, uarmF: -54, farmF: -32 },
      { ...SUPINE, thighN: -130, shinN: -12, footN: -66, thighF: -128, shinF: -10, footF: -64, uarmN: -62, farmN: -44, uarmF: -60, farmF: -42 },
    ],
    glow: ['lumbar'],
  },
  pelvictilt: {
    flow: true, pingpong: true, beat: 2.2, pause: 0.6,
    anchor: 'hip',
    frames: [
      { ...SUPINE, ...KNEES_UP, lumbar: 180 },
      { ...SUPINE, ...KNEES_UP, lumbar: 191, thorax: 181 },
    ],
    glow: ['lumbar'],
  },
  constructive: {
    anchor: 'hip',
    frames: [{ ...SUPINE, ...KNEES_UP, thighN: -60, shinN: 62, thighF: -58, shinF: 64, uarmN: -4, farmN: -42, handN: -20, uarmF: -2, farmF: -40, handF: -18 }],
    glow: [],
  },
  floormelt: {
    anchor: 'hip',
    frames: [{ ...SUPINE, thighN: -8, shinN: 12, footN: -60, thighF: -7, shinF: 13, footF: -62, uarmN: 14, farmN: 4, uarmF: 16, farmF: 5 }],
    props: [{ t: 'cushion', under: 'kneeN', w: 34 }],
    glow: [],
  },
  lyinghamstring: {
    anchor: 'hip', beat: 2.6,
    frames: [
      { ...SUPINE, ...KNEES_UP, uarmN: -40, farmN: -30, uarmF: -38, farmF: -28 },
      { ...SUPINE, ...KNEES_UP, thighN: -72, shinN: -72, footN: -165, uarmN: -50, farmN: -58, handN: -60, uarmF: -48, farmF: -56, handF: -58 },
    ],
    props: [
      { t: 'strap', from: 'wristN', to: 'toeN' },
      { t: 'strap', from: 'wristF', to: 'toeN', z: 13 },
    ],
    glow: ['thighN'],
  },
  legsupwall: {
    anchor: 'hip', beat: 3,
    frames: [
      { ...SUPINE, ...KNEES_UP },
      { ...SUPINE, thighN: -85, shinN: -85, footN: -150, thighF: -84, shinF: -84, footF: -148, uarmN: 22, farmN: 4, uarmF: 24, farmF: 6 },
    ],
    props: [{ t: 'wall', at: 'hip', side: 'right' }],
    glow: ['thighN', 'shinN'],
  },
  fish: {
    anchor: 'hip', beat: 3,
    frames: [
      { ...SUPINE, ...KNEES_UP },
      { ...SUPINE, ...KNEES_UP, lumbar: 195, thorax: 190, neck: 185, head: 180, uarmN: 18, farmN: 8, uarmF: 20, farmF: 9 },
    ],
    props: [
      { t: 'block', under: 'neckBase', dx: 7, w: 23 },
      { t: 'block', under: 'headC', w: 23 },
    ],
    glow: ['thorax'],
  },

  // ---------- lying on the back (seen from above) ----------
  twist: {
    view: 'top', beat: 2.8,
    frames: [
      { lumbar: 180, thorax: 180, neck: 180, head: 180, thighL: 8, shinL: 4, thighR: -8, shinR: -4, sc: { thighL: 0.62, thighR: 0.62, shinL: 0.55, shinR: 0.55, footL: 0.45, footR: 0.45 }, uarmR: -90, farmR: -90, handR: -90, uarmL: 90, farmL: 90, handL: 90 },
      { lumbar: 176, thorax: 180, neck: 184, head: 186, turn: 0.9, thighL: 62, shinL: 8, thighR: 52, shinR: 14, sc: { thighL: 0.95, thighR: 0.95, shinL: 0.9, shinR: 0.9, footL: 0.45, footR: 0.45 }, uarmR: -90, farmR: -90, handR: -90, uarmL: 90, farmL: 90, handL: 90 },
    ],
    glow: ['lumbar', 'thighR'],
  },
  recbutterfly: {
    view: 'top', beat: 2.8,
    frames: [
      { lumbar: 180, thorax: 180, neck: 180, head: 180, thighR: -8, shinR: -4, thighL: 8, shinL: 4, sc: { thighL: 0.62, thighR: 0.62, shinL: 0.55, shinR: 0.55, footL: 0.45, footR: 0.45 }, uarmR: -12, farmR: -8, uarmL: 12, farmL: 8 },
      { lumbar: 180, thorax: 180, neck: 180, head: 180, thighR: -42, shinR: 45, footR: 10, thighL: 42, shinL: -45, footL: -10, sc: { footL: 0.6, footR: 0.6 }, uarmR: -12, farmR: -8, uarmL: 12, farmL: 8 },
    ],
    props: [
      { t: 'block', at: 'kneeR', w: 15, h: 23 },
      { t: 'block', at: 'kneeL', w: 15, h: 23 },
    ],
    glow: ['thighR', 'thighL'],
  },
  figurefour: {
    view: 'top', beat: 2.8,
    frames: [
      { lumbar: 180, thorax: 180, neck: 180, head: 180, thighL: 4, shinL: 2, thighR: -4, shinR: -2, sc: { thighL: 0.6, thighR: 0.6, shinL: 0.5, shinR: 0.5, footL: 0.45, footR: 0.45 }, uarmR: -12, farmR: -8, uarmL: 12, farmL: 8 },
      { lumbar: 180, thorax: 180, neck: 180, head: 180, thighL: 2, shinL: 0, thighR: -38, shinR: 100, footR: 60, sc: { thighL: 0.6, shinL: 0.5, thighR: 0.85, shinR: 0.92, footL: 0.45, footR: 0.45 }, uarmR: 8, farmR: 28, uarmL: 14, farmL: -6 },
    ],
    glow: ['thighR', 'hip'],
  },

  // ---------- seated on the floor ----------
  butterfly: {
    view: 'front', beat: 2.8,
    frames: [
      { thighR: -8, shinR: 162, footR: 100, thighL: 188, shinL: 18, footL: 80, sc: { thighR: 0.8, thighL: 0.8, footR: 0.4, footL: 0.4 }, uarmR: 102, farmR: 104, handR: 104, uarmL: 78, farmL: 76, handL: 76 },
      { sc: { lumbar: 0.8, thorax: 0.72, neck: 0.5, thighR: 0.8, thighL: 0.8, footR: 0.4, footL: 0.4 }, thighR: -8, shinR: 162, footR: 100, thighL: 188, shinL: 18, footL: 80, uarmR: 72, farmR: 128, handR: 120, uarmL: 108, farmL: 52, handL: 60 },
    ],
    props: [
      { t: 'block', under: 'kneeR', w: 15 },
      { t: 'block', under: 'kneeL', w: 15 },
    ],
    glow: ['thighR', 'thighL'],
  },
  butterflytest: {
    view: 'front',
    frames: [
      { thighR: -8, shinR: 162, footR: 100, thighL: 188, shinL: 18, footL: 80, sc: { thighR: 0.8, thighL: 0.8, footR: 0.4, footL: 0.4 }, uarmR: 102, farmR: 104, handR: 104, uarmL: 78, farmL: 76, handL: 76 },
    ],
    glow: ['thighR', 'thighL'],
  },
  wideleg: {
    view: 'front', beat: 2.8,
    frames: [
      { thighR: 14, shinR: 12, thighL: 166, shinL: 168, footR: -70, footL: -110, sc: { footR: 0.5, footL: 0.5 }, uarmR: 80, farmR: 80, uarmL: 100, farmL: 100 },
      { thighR: 14, shinR: 12, thighL: 166, shinL: 168, footR: -70, footL: -110, sc: { lumbar: 0.85, thorax: 0.7, neck: 0.5, footR: 0.5, footL: 0.5 }, uarmR: 92, farmR: 92, uarmL: 88, farmL: 88 },
    ],
    props: [
      { t: 'block', under: 'hip', w: 23 },
      { t: 'block', under: 'wristR', w: 15, layer: 'front' },
      { t: 'block', under: 'wristL', w: 15, layer: 'front' },
    ],
    glow: ['thighR', 'thighL'],
  },
  seatedfold: {
    anchor: 'hip', beat: 3,
    frames: [
      { lumbar: -88, thorax: -90, thighN: 5, shinN: 20, footN: -70, thighF: 6, shinF: 19, footF: -70, uarmN: 70, farmN: 60, uarmF: 72, farmF: 62 },
      { lumbar: -45, thorax: -15, neck: 10, head: 25, thighN: 5, shinN: 20, footN: -70, thighF: 6, shinF: 19, footF: -70, uarmN: 62, farmN: 40, handN: 30, uarmF: 64, farmF: 42, handF: 30 },
    ],
    props: [{ t: 'block', under: 'hip', w: 23 }],
    glow: ['thighN', 'lumbar'],
  },
  seatedsidebend: {
    view: 'front', beat: 2.6,
    frames: [
      { ...CROSS },
      { ...CROSS, pelvis: -90, lumbar: -100, thorax: -122, neck: -126, head: -132, uarmR: -118, farmR: -150, handR: -156, uarmL: 114, farmL: 104, handL: 96 },
    ],
    props: [{ t: 'block', under: 'hip', w: 23 }],
    glow: ['sideR'],
  },
  easyseat: {
    view: 'front',
    frames: [{ ...CROSS }],
    props: [{ t: 'block', under: 'hip', w: 23 }],
    glow: [],
  },
  necktest: {
    view: 'front',
    frames: [{ ...CROSS, turn: 1 }],
    props: [{ t: 'block', under: 'hip', w: 23 }],
    glow: ['neck'],
  },
  windshield: {
    view: 'front', flow: true, pingpong: true, beat: 2.2, pause: 0.6,
    frames: [
      { thighR: -30, shinR: 120, thighL: 200, shinL: 58, sc: { thighR: 0.6, thighL: 0.6 }, uarmR: 128, farmR: 120, uarmL: 52, farmL: 60, behind: ['armL', 'armR'] },
      { thighR: -10, shinR: 150, thighL: 222, shinL: 96, sc: { thighR: 0.75, thighL: 0.5 }, uarmR: 128, farmR: 120, uarmL: 52, farmL: 60, behind: ['armL', 'armR'] },
      { thighR: -42, shinR: 84, thighL: 190, shinL: 30, sc: { thighR: 0.5, thighL: 0.75 }, uarmR: 128, farmR: 120, uarmL: 52, farmL: 60, behind: ['armL', 'armR'] },
    ],
    glow: ['thighR', 'thighL'],
  },

  // ---------- standing, front view ----------
  sidebend: {
    view: 'front', groundOn: FRONT_FEET, beat: 2.4,
    frames: [
      { uarmR: -80, farmR: -84, handR: -84, uarmL: -100, farmL: -96, handL: -96 },
      { pelvis: -90, lumbar: -98, thorax: -116, neck: -120, head: -124, uarmR: -126, farmR: -148, handR: -152, uarmL: -140, farmL: -160, handL: -164 },
    ],
    glow: ['sideR'],
  },
  hipcircles: {
    view: 'front', flow: true, pingpong: true, beat: 1.6, pause: 0.2,
    groundOn: FRONT_FEET, anchor: 'ankleL',
    frames: [
      { thighL: 96, shinL: 96, thighR: 96, shinR: 96, lumbar: -86, thorax: -93, uarmR: 60, farmR: 150, uarmL: 120, farmL: 30 },
      { thighL: 84, shinL: 84, thighR: 84, shinR: 84, lumbar: -94, thorax: -87, uarmR: 60, farmR: 150, uarmL: 120, farmL: 30 },
    ],
    glow: ['hip'],
  },
  crossbody: {
    view: 'front', groundOn: FRONT_FEET, beat: 2.2,
    frames: [
      {},
      { uarmR: 176, farmR: 180, handR: 180, uarmL: 96, farmL: -66, handL: -60, front: ['armL'] },
    ],
    glow: ['uarmR', 'trapR'],
  },
  selfhug: {
    view: 'front', groundOn: FRONT_FEET, beat: 2.2,
    frames: [
      {},
      { uarmR: 160, farmR: -150, handR: -140, uarmL: 20, farmL: -30, handL: -40, neck: -90, head: -90, sc: { neck: 0.45, farmR: 0.45, farmL: 0.45, handR: 0.7, handL: 0.7 }, front: ['armR'] },
    ],
    glow: ['trapL', 'trapR'],
  },
  scratchtest: {
    view: 'front', groundOn: FRONT_FEET,
    frames: [
      { uarmR: -96, farmR: 96, handR: 96, uarmL: 104, farmL: -84, handL: -84, behind: ['armL', 'armR'] },
    ],
    glow: ['uarmR', 'uarmL'],
  },

  // ---------- on a chair ----------
  neckside: {
    view: 'front', groundOn: FRONT_FEET, beat: 2.4,
    frames: [
      { ...CHAIR_FRONT },
      { ...CHAIR_FRONT, neck: -62, head: -48, uarmR: -58, farmR: 186, handR: 190, uarmL: 112, farmL: 104, handL: 104 },
    ],
    props: [{ t: 'chair' }],
    glow: ['trapL', 'neck'],
  },
  neckcircles: {
    view: 'front', flow: true, pingpong: true, beat: 2.4, pause: 0.5,
    groundOn: FRONT_FEET,
    frames: [
      { ...CHAIR_FRONT, neck: -62, head: -50 },
      { ...CHAIR_FRONT, neck: -90, head: -90, sc: { ...CHAIR_FRONT.sc, neck: 0.3 } },
      { ...CHAIR_FRONT, neck: -118, head: -130 },
    ],
    props: [{ t: 'chair' }],
    glow: ['neck'],
  },
  shoulderrolls: {
    flow: true, beat: 0.9, pause: 0,
    groundOn: FEET,
    frames: [
      { ...CHAIR_SIDE, sh: 0, shf: 3 },
      { ...CHAIR_SIDE, sh: 5.5, shf: 1 },
      { ...CHAIR_SIDE, sh: 2, shf: -4.5, thorax: -93 },
      { ...CHAIR_SIDE, sh: -2.5, shf: -1 },
    ],
    props: [{ t: 'chair' }],
    glow: ['trapN'],
  },
  chaircatcow: {
    flow: true, pingpong: true, beat: 2.6, pause: 0.5,
    groundOn: FEET,
    frames: [
      { ...CHAIR_SIDE, lumbar: -80, thorax: -95, neck: -100, head: -110 },
      { ...CHAIR_SIDE, lumbar: -100, thorax: -64, neck: -22, head: 8, uarmN: 90, farmN: 28, uarmF: 88, farmF: 26 },
    ],
    props: [{ t: 'chair' }],
    glow: ['lumbar', 'thorax'],
  },
  chairfold: {
    groundOn: FEET, beat: 2.8,
    frames: [
      { ...CHAIR_SIDE },
      { ...CHAIR_SIDE, lumbar: -15, thorax: 40, neck: 75, head: 85, uarmN: 100, farmN: 15, handN: 0, uarmF: 102, farmF: 17, handF: 0 },
    ],
    props: [{ t: 'chair' }],
    glow: ['lumbar', 'thorax'],
  },
  chairtwist: {
    view: 'front', groundOn: FRONT_FEET, beat: 2.4,
    frames: [
      { ...CHAIR_FRONT },
      { ...CHAIR_FRONT, shW: 12, turn: -0.9, thorax: -93, uarmR: 128, farmR: 168, handR: 172, uarmL: 118, farmL: 100, handL: 100, behind: ['armL'], front: ['armR'] },
    ],
    props: [{ t: 'chair' }],
    glow: ['lumbar', 'neck'],
  },
  chairfour: {
    view: 'front', groundOn: ['ankleL', 'toeL'], beat: 2.6,
    frames: [
      { ...CHAIR_FRONT },
      { ...CHAIR_FRONT, thighR: 2, shinR: 186, footR: 176, sc: { thighL: 0.28, thighR: 0.62, footR: 0.5, footL: 0.45 }, uarmR: 86, farmR: 96, handR: 96, uarmL: 84, farmL: 60, handL: 60 },
    ],
    props: [{ t: 'chair' }],
    glow: ['thighR', 'hip'],
  },
};
