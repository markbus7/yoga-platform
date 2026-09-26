// A 2D mannequin posed with absolute bone angles, drawn to scale (1 unit = 1 cm).
//
// Angles are screen degrees: 0 points right, 90 down, 180 left, -90 up.
// Side-view figures face right, so 0 is "forward". Their limbs are N (near,
// drawn in front) and F (far, drawn behind). Front and top views use L and R
// for the screen-left and screen-right limbs; screen-right is the figure's own
// left side when it faces you. Top views are the front rig lying on the mat,
// seen from above.

const RAD = Math.PI / 180;

export const BONES = {
  lumbar: { len: 24, r0: 12, r1: 12.4 },
  thorax: { len: 30, r0: 12.8, r1: 12 },
  neck: { len: 8, r0: 5, r1: 5 },
  thigh: { len: 44, r0: 8.2, r1: 5.8 },
  shin: { len: 42, r0: 5.6, r1: 4.2 },
  foot: { len: 17, r0: 4.4, r1: 3.2 },
  uarm: { len: 29, r0: 5.2, r1: 4.2 },
  farm: { len: 25, r0: 4.2, r1: 3.4 },
  hand: { len: 8, r0: 3.4, r1: 3 },
};
export const HEAD_R = 10.5;
const HEAD_OFFSET = 10;

export const VIEW_W = 320;
export const VIEW_H = 240;
const FLOOR_Y = 222;

const SIDE_BASE = {
  lumbar: -90, thorax: -90,
  thighN: 90, shinN: 90, thighF: 91.5, shinF: 90.5,
  uarmN: 94, farmN: 88, uarmF: 88, farmF: 92,
  sh: 0, shf: 0,
};

const FRONT_BASE = {
  lumbar: -90, thorax: -90,
  thighL: 94, shinL: 90, thighR: 86, shinR: 90,
  uarmL: 98, farmL: 94, uarmR: 82, farmR: 86,
  hipW: 8.5, shW: 17, shL: 0, shR: 0, turn: 0,
};

const ANGLE_KEY = /^(lumbar|thorax|neck|head|thigh|shin|foot|uarm|farm|hand)/;
const NON_NUMERIC = new Set(['view', 'sc', 'behind', 'front']);

export const dir = (deg) => [Math.cos(deg * RAD), Math.sin(deg * RAD)];
const along = (p, deg, len) => {
  const d = dir(deg);
  return [p[0] + d[0] * len, p[1] + d[1] * len];
};

/** Fill in every angle a pose leaves out. */
export function resolvePose(p) {
  const view = p.view || 'side';
  const base = view === 'side' ? SIDE_BASE : FRONT_BASE;
  const r = { ...base, ...p, view, sc: { ...(p.sc || {}) } };
  if (r.neck == null) r.neck = r.thorax;
  if (r.head == null) r.head = r.neck;
  if (view !== 'side' && r.pelvis == null) r.pelvis = r.lumbar;
  const sides = view === 'side' ? ['N', 'F'] : ['L', 'R'];
  for (const s of sides) {
    if (r['hand' + s] == null) r['hand' + s] = r['farm' + s];
    if (r['foot' + s] == null) {
      if (view === 'side') r['foot' + s] = r['shin' + s] - 84;
      else r['foot' + s] = r['shin' + s] + (s === 'R' ? -50 : 50);
    }
    if (view !== 'side' && r.sc['foot' + s] == null) r.sc['foot' + s] = 0.45;
  }
  return r;
}

/**
 * Blend two resolved poses. Angles interpolate numerically, so a keyframe
 * author controls the direction of travel. With `wrap`, each target angle is
 * first moved by whole turns to sit within 180 degrees of the start (used when
 * a looping flow jumps from its last frame back to its first).
 */
export function lerpPose(a, b, t, wrap = false) {
  const out = { ...a, sc: { ...a.sc } };
  for (const k of Object.keys(b)) {
    if (NON_NUMERIC.has(k)) continue;
    const va = a[k];
    let vb = b[k];
    if (typeof va === 'number' && typeof vb === 'number') {
      if (wrap && ANGLE_KEY.test(k)) {
        while (vb - va > 180) vb -= 360;
        while (vb - va < -180) vb += 360;
      }
      out[k] = va + (vb - va) * t;
    } else if (vb !== undefined) out[k] = t < 0.5 ? va : vb;
  }
  const keys = new Set([...Object.keys(a.sc), ...Object.keys(b.sc)]);
  for (const k of keys) {
    const va = a.sc[k] ?? 1;
    const vb = b.sc[k] ?? 1;
    out.sc[k] = va + (vb - va) * t;
  }
  out.behind = t < 0.5 ? a.behind : b.behind;
  out.front = t < 0.5 ? a.front : b.front;
  return out;
}

function limb(out, p, s, root, z, view) {
  const k = (name) => p.sc[name + s] ?? 1;
  const knee = along(root, p['thigh' + s], BONES.thigh.len * k('thigh'));
  const ankle = along(knee, p['shin' + s], BONES.shin.len * k('shin'));
  const toe = along(ankle, p['foot' + s], BONES.foot.len * k('foot'));
  out.pts['knee' + s] = knee;
  out.pts['ankle' + s] = ankle;
  out.pts['toe' + s] = toe;
  out.segs.push(
    { key: 'thigh' + s, a: root, b: knee, r0: BONES.thigh.r0, r1: BONES.thigh.r1, z },
    { key: 'shin' + s, a: knee, b: ankle, r0: BONES.shin.r0, r1: BONES.shin.r1, z },
    { key: 'foot' + s, a: ankle, b: toe, r0: BONES.foot.r0, r1: BONES.foot.r1, z },
  );
  out.contacts.push(
    { n: 'knee' + s, p: knee, r: 6 },
    { n: 'ankle' + s, p: ankle, r: view === 'side' ? 4.8 : 4.4 },
    { n: 'toe' + s, p: toe, r: 3.2 },
  );
}

function arm(out, p, s, root, z) {
  const k = (name) => p.sc[name + s] ?? 1;
  const elbow = along(root, p['uarm' + s], BONES.uarm.len * k('uarm'));
  const wrist = along(elbow, p['farm' + s], BONES.farm.len * k('farm'));
  const tip = along(wrist, p['hand' + s], BONES.hand.len * k('hand'));
  out.pts['elbow' + s] = elbow;
  out.pts['wrist' + s] = wrist;
  out.pts['tip' + s] = tip;
  out.segs.push(
    { key: 'uarm' + s, a: root, b: elbow, r0: BONES.uarm.r0, r1: BONES.uarm.r1, z },
    { key: 'farm' + s, a: elbow, b: wrist, r0: BONES.farm.r0, r1: BONES.farm.r1, z },
    { key: 'hand' + s, a: wrist, b: tip, r0: BONES.hand.r0, r1: BONES.hand.r1, z },
  );
  out.contacts.push(
    { n: 'elbow' + s, p: elbow, r: 4.3 },
    { n: 'wrist' + s, p: wrist, r: 3.4 },
    { n: 'tip' + s, p: tip, r: 3 },
  );
}

/** Forward kinematics: joint points, drawable segments and floor contacts. */
export function solvePose(input) {
  const p = input.sc && input.view ? input : resolvePose(input);
  const hip = [0, 0];
  const waist = along(hip, p.lumbar, BONES.lumbar.len * (p.sc.lumbar ?? 1));
  const neckBase = along(waist, p.thorax, BONES.thorax.len * (p.sc.thorax ?? 1));
  const neckTop = along(neckBase, p.neck, BONES.neck.len * (p.sc.neck ?? 1));
  const headC = along(neckTop, p.head, HEAD_OFFSET);
  const out = {
    view: p.view,
    pose: p,
    pts: { hip, waist, neckBase, neckTop, headC },
    segs: [],
    contacts: [],
    torso: null,
  };
  const front = new Set(p.front || []);
  const behind = new Set(p.behind || []);

  if (p.view === 'side') {
    let shoulder = along(neckBase, p.thorax, -5 + (p.sh || 0));
    shoulder = along(shoulder, p.thorax + 90, p.shf || 0);
    out.pts.shoulderN = shoulder;
    out.pts.shoulderF = shoulder;
    limb(out, p, 'F', hip, 10, 'side');
    arm(out, p, 'F', shoulder, 12);
    out.segs.push(
      { key: 'lumbar', a: hip, b: waist, r0: BONES.lumbar.r0, r1: BONES.lumbar.r1, z: 20 },
      { key: 'thorax', a: waist, b: neckBase, r0: BONES.thorax.r0, r1: BONES.thorax.r1, z: 21 },
      { key: 'neck', a: neckBase, b: neckTop, r0: BONES.neck.r0, r1: BONES.neck.r1, z: 22 },
    );
    limb(out, p, 'N', hip, 30, 'side');
    arm(out, p, 'N', shoulder, behind.has('armN') ? 19 : 32);
    out.contacts.push(
      { n: 'hip', p: hip, r: 12 },
      { n: 'waist', p: waist, r: 12.4 },
      { n: 'neckBase', p: neckBase, r: 12.2 },
      { n: 'headC', p: headC, r: HEAD_R },
    );
  } else {
    // The hip line follows `pelvis` (defaults to the lumbar angle) so a side
    // bend can tilt the spine while the pelvis stays level.
    const pelvis = p.pelvis ?? p.lumbar;
    const perpP = pelvis + 90;
    const perpL = p.lumbar + 90;
    const perpT = p.thorax + 90;
    const hipR = along(hip, perpP, p.hipW);
    const hipL = along(hip, perpP, -p.hipW);
    const shBase = along(neckBase, p.thorax, -4);
    const shoulderR = along(along(shBase, perpT, p.shW), p.thorax, p.shR || 0);
    const shoulderL = along(along(shBase, perpT, -p.shW), p.thorax, p.shL || 0);
    Object.assign(out.pts, { hipR, hipL, shoulderR, shoulderL });
    limb(out, p, 'L', hipL, 10, 'front');
    limb(out, p, 'R', hipR, 11, 'front');
    const zArm = (s, base) => (behind.has('arm' + s) ? base - 25 : front.has('arm' + s) ? base + 10 : base);
    arm(out, p, 'L', shoulderL, zArm('L', 30));
    arm(out, p, 'R', shoulderR, zArm('R', 31));
    const w = p.shW;
    const chestR = along(along(neckBase, p.thorax, -13), perpT, w - 3.5);
    const chestL = along(along(neckBase, p.thorax, -13), perpT, -(w - 3.5));
    const waistR = along(waist, perpL, 10.5);
    const waistL = along(waist, perpL, -10.5);
    const hipOR = along(along(hip, pelvis, 2), perpP, 11.5);
    const hipOL = along(along(hip, pelvis, 2), perpP, -11.5);
    const shInR = along(shoulderR, perpT, -3);
    const shInL = along(shoulderL, perpT, 3);
    out.torso = { poly: [shInL, shInR, chestR, waistR, hipOR, hipOL, waistL, chestL], z: 20 };
    out.segs.push({ key: 'neck', a: neckBase, b: neckTop, r0: 5.4, r1: 5, z: 22 });
    out.contacts.push(
      { n: 'hip', p: hip, r: 11 },
      { n: 'headC', p: headC, r: HEAD_R },
      { n: 'shoulderR', p: shoulderR, r: 6 },
      { n: 'shoulderL', p: shoulderL, r: 6 },
    );
  }
  return out;
}

// ---------- geometry to SVG path strings ----------

const f = (n) => (Math.round(n * 10) / 10).toString();

/** Tapered capsule: two circles joined by their outer tangents. */
export function capsulePath(a, b, r0, r1) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const d = Math.hypot(dx, dy);
  if (d < Math.abs(r0 - r1) + 0.01) {
    return circlePath(r0 >= r1 ? a : b, Math.max(r0, r1));
  }
  const th = Math.atan2(dy, dx);
  const ph = Math.acos((r0 - r1) / d);
  const p1 = [a[0] + r0 * Math.cos(th + ph), a[1] + r0 * Math.sin(th + ph)];
  const p2 = [b[0] + r1 * Math.cos(th + ph), b[1] + r1 * Math.sin(th + ph)];
  const p3 = [b[0] + r1 * Math.cos(th - ph), b[1] + r1 * Math.sin(th - ph)];
  const p4 = [a[0] + r0 * Math.cos(th - ph), a[1] + r0 * Math.sin(th - ph)];
  const bigB = 2 * ph > Math.PI ? 1 : 0;
  const bigA = 2 * Math.PI - 2 * ph > Math.PI ? 1 : 0;
  return `M${f(p1[0])} ${f(p1[1])}L${f(p2[0])} ${f(p2[1])}A${f(r1)} ${f(r1)} 0 ${bigB} 0 ${f(p3[0])} ${f(p3[1])}L${f(p4[0])} ${f(p4[1])}A${f(r0)} ${f(r0)} 0 ${bigA} 0 ${f(p1[0])} ${f(p1[1])}Z`;
}

export function circlePath(c, r) {
  return `M${f(c[0] - r)} ${f(c[1])}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
}

function polyPath(pts) {
  return 'M' + pts.map((q) => `${f(q[0])} ${f(q[1])}`).join('L') + 'Z';
}

/** A crescent of hair on the back and crown of the head, so you can tell which way it faces. */
function hairPath(side, c, h, r, turn) {
  const R = r + 0.4 * (r / HEAD_R);
  let a1;
  let a2;
  let ctrl;
  if (side) {
    a1 = h - 128;
    a2 = h + 30;
    ctrl = along(along(c, h, -0.14 * r), h - 90, 0.22 * r);
  } else {
    a1 = h - 76 + turn * 34;
    a2 = h + 76 + turn * 34;
    ctrl = along(along(c, h, 0.08 * r), h + 90, turn * 0.36 * r);
  }
  const A = along(c, a1, R);
  const B = along(c, a2, R);
  return `M${f(A[0])} ${f(A[1])}A${f(R)} ${f(R)} 0 0 1 ${f(B[0])} ${f(B[1])}Q${f(ctrl[0])} ${f(ctrl[1])} ${f(A[0])} ${f(A[1])}Z`;
}

// ---------- placing a figure in the frame ----------

function shiftSolution(sol, dx, dy) {
  if (!dx && !dy) return sol;
  const mv = (q) => [q[0] + dx, q[1] + dy];
  const pts = {};
  for (const k of Object.keys(sol.pts)) pts[k] = mv(sol.pts[k]);
  return {
    ...sol,
    pts,
    segs: sol.segs.map((s) => ({ ...s, a: mv(s.a), b: mv(s.b) })),
    contacts: sol.contacts.map((c) => ({ ...c, p: mv(c.p) })),
    torso: sol.torso ? { ...sol.torso, poly: sol.torso.poly.map(mv) } : null,
  };
}

function lowestContact(sol, groundOn) {
  let max = -Infinity;
  for (const c of sol.contacts) {
    if (groundOn && !groundOn.some((g) => c.n === g || c.n.startsWith(g))) continue;
    max = Math.max(max, c.p[1] + c.r);
  }
  return max === -Infinity ? 0 : max;
}

function boundsOf(sol) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  const grow = (pt, r) => {
    x0 = Math.min(x0, pt[0] - r);
    x1 = Math.max(x1, pt[0] + r);
    y0 = Math.min(y0, pt[1] - r);
    y1 = Math.max(y1, pt[1] + r);
  };
  for (const s of sol.segs) {
    grow(s.a, s.r0);
    grow(s.b, s.r1);
  }
  grow(sol.pts.headC, HEAD_R + 1);
  if (sol.torso) for (const q of sol.torso.poly) grow(q, 6);
  return { x0, y0, x1, y1 };
}

/** Solve a pose and place it: feet (or whatever touches) on the floor, anchor joint held still. */
function place(fig, pose) {
  let sol = solvePose(pose);
  // `lift` raises the body onto something lying on the floor (an acupressure mat).
  if (fig.view !== 'top') sol = shiftSolution(sol, 0, -lowestContact(sol, fig.groundOn) - (fig.spec.lift || 0));
  if (fig.anchorPt) {
    const a = sol.pts[fig.anchor];
    if (a) sol = shiftSolution(sol, fig.anchorPt[0] - a[0], fig.view === 'top' ? fig.anchorPt[1] - a[1] : 0);
  }
  return sol;
}

const CONTACT_R = {
  hip: 12, waist: 12.4, neckBase: 12.2, headC: HEAD_R,
  knee: 6, ankle: 4.8, toe: 3.2, elbow: 4.3, wrist: 3.4, tip: 3, shoulder: 6,
};
function contactRadius(name) {
  return CONTACT_R[name.replace(/[NFLR]$/, '')] ?? 4;
}

/**
 * Prepare an exercise figure: resolve keyframes, place props against the
 * final (hold) frame and find one fixed scale and offset that fits every frame.
 */
export function prepareFigure(spec) {
  const view = spec.view || 'side';
  const rigView = view === 'top' ? 'front' : view;
  const frames = spec.frames.map((fr) => resolvePose({ ...fr, view: rigView }));
  const fig = {
    spec,
    view,
    frames,
    groundOn: spec.groundOn || null,
    anchor: spec.anchor || 'hip',
    anchorPt: null,
  };
  const finalSol = place(fig, frames[frames.length - 1]);
  fig.anchorPt = finalSol.pts[fig.anchor] || [0, 0];

  const samples = [];
  for (let i = 0; i < frames.length; i++) {
    samples.push(frames[i]);
    if (frames.length > 1) {
      const next = frames[(i + 1) % frames.length];
      samples.push(lerpPose(frames[i], next, 0.5, i === frames.length - 1));
    }
  }
  let b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  const growBox = (o) => {
    b = { x0: Math.min(b.x0, o.x0), y0: Math.min(b.y0, o.y0), x1: Math.max(b.x1, o.x1), y1: Math.max(b.y1, o.y1) };
  };
  for (const fr of samples) growBox(boundsOf(place(fig, fr)));

  fig.props = placeProps(spec.props || [], finalSol, view === 'top');
  for (const pr of fig.props) if (pr.bbox) growBox(pr.bbox);

  const margin = 12;
  const availW = VIEW_W - margin * 2;
  const availH = view === 'top' ? VIEW_H - margin * 2 : FLOOR_Y - margin;
  const w = b.x1 - b.x0;
  const h = view === 'top' ? b.y1 - b.y0 : -b.y0;
  fig.scale = Math.min(1, availW / w, availH / h) * (spec.zoom || 1);
  const cx = (b.x0 + b.x1) / 2;
  fig.tx = VIEW_W / 2 - cx * fig.scale;
  fig.ty = view === 'top' ? VIEW_H / 2 - ((b.y0 + b.y1) / 2) * fig.scale : FLOOR_Y;
  fig.matWidth = Math.max(183, w + 20);
  fig.matCenter = cx;
  fig.bounds = b;
  return fig;
}

function placeProps(props, sol, top) {
  const out = [];
  for (const pr of props) {
    const name = pr.under || pr.at;
    const pt = name ? sol.pts[name] : null;
    if (name && !pt) continue;
    if (pr.t === 'block' && top) {
      const w = pr.w ?? 23;
      const h = pr.h ?? 15;
      const x = pt[0] + (pr.dx || 0) - w / 2;
      const y = pt[1] + (pr.dy || 0) - h / 2;
      out.push({ t: 'block', x, y, w, h, z: pr.z ?? 1, bbox: { x0: x, x1: x + w, y0: y, y1: y + h } });
    } else if (pr.t === 'block' || pr.t === 'cushion') {
      const w = pr.w ?? (pr.t === 'cushion' ? 34 : 23);
      const topY = pt[1] + contactRadius(name) + (pr.gap || 0);
      const h = Math.max(0, -topY);
      if (h < 2) continue;
      const x = pt[0] + (pr.dx || 0) - w / 2;
      const z = pr.z ?? { near: 31, front: 40, far: 11 }[pr.layer] ?? 2;
      out.push({ t: pr.t, x, y: -h, w, h, z, bbox: { x0: x, x1: x + w, y0: -h, y1: 0 } });
    } else if (pr.t === 'wall') {
      const r = contactRadius(name);
      const side = pr.side || 'right';
      const x = side === 'right' ? pt[0] + r + (pr.gap || 0) : pt[0] - r - (pr.gap || 0);
      out.push({ t: 'wall', x, side, z: -12, bbox: { x0: x - 1, x1: x + 1, y0: 0, y1: 0 } });
    } else if (pr.t === 'strap') {
      out.push({ t: 'strap', from: pr.from, to: pr.to, z: pr.z ?? 33 });
    } else if (pr.t === 'spreaders') {
      out.push({ t: 'spreaders' });
    } else if (pr.t === 'shakti') {
      const w = pr.w ?? 68;
      const h = pr.h ?? 3.4;
      const x = pt[0] + (pr.dx || 0) - w / 2;
      out.push({ t: 'shakti', x, w, h, z: pr.z ?? 3, bbox: { x0: x, x1: x + w, y0: -h - 1, y1: 0 } });
    } else if (pr.t === 'chair') {
      const hip = sol.pts.hip;
      const seatY = hip[1] + 12;
      if (sol.view === 'side') {
        const x0 = hip[0] - 20;
        out.push({ t: 'chair', side: true, x0, x1: hip[0] + 24, seatY, backX: x0 - 1, z: 1, bbox: { x0: x0 - 6, x1: hip[0] + 24, y0: seatY - 48, y1: 0 } });
      } else {
        out.push({ t: 'chair', side: false, x0: hip[0] - 24, x1: hip[0] + 24, seatY, z: 1, bbox: { x0: hip[0] - 26, x1: hip[0] + 26, y0: seatY, y1: 0 } });
      }
    }
  }
  return out;
}

// ---------- sampling an animation ----------

const ease = (t) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, t)));

/**
 * Pose at time `t` (seconds). Modes:
 *  - 'preview': loop the whole exercise (flows cycle; holds go in, rest, come out)
 *  - 'enter':   move once from the first frame to the last over `enterSec`
 *  - 'hold':    the final frame, breathing gently (flows keep flowing)
 *  - 'still':   the final frame, no motion
 */
export function poseAt(fig, t, mode = 'preview', enterSec = 3) {
  const { frames, spec } = fig;
  const last = frames[frames.length - 1];
  const breathe = (pose, amp = 1) => {
    const s = Math.sin((t / 5.5) * Math.PI * 2) * amp;
    return { ...pose, thorax: pose.thorax + s * 1.2, neck: pose.neck + s * 1.4, head: pose.head + s * 1.4 };
  };
  if (mode === 'still') return frames[spec.still ?? frames.length - 1] || last;
  if (frames.length === 1) return breathe(last);
  const beat = spec.beat || 2.6;
  const pause = spec.pause ?? 0.5;

  if (spec.flow) {
    const seg = beat + pause;
    const n = frames.length;
    const loop = spec.pingpong ? (n - 1) * 2 : n;
    const cyc = ((t % (seg * loop)) + seg * loop) % (seg * loop);
    const i = Math.floor(cyc / seg);
    const local = cyc - i * seg;
    const u = local < pause ? 0 : ease((local - pause) / beat);
    if (spec.pingpong) {
      const fwd = i < n - 1;
      const idx = fwd ? i : loop - i;
      return lerpPose(frames[idx], frames[fwd ? idx + 1 : idx - 1], u);
    }
    return lerpPose(frames[i % n], frames[(i + 1) % n], u, i === n - 1);
  }

  if (mode === 'hold') return breathe(last);
  const n = frames.length - 1;
  if (mode === 'enter') {
    const u = Math.min(1, t / enterSec) * n;
    const i = Math.min(n - 1, Math.floor(u));
    return lerpPose(frames[i], frames[i + 1], ease(u - i));
  }
  // preview loop for holds: rest in setup, move in, breathe, move back out
  const inSec = beat * n;
  const rest = spec.rest ?? 3.4;
  const outSec = 1.8;
  const gap = 0.9;
  const total = gap + inSec + rest + outSec;
  const c = ((t % total) + total) % total;
  if (c < gap) return frames[0];
  if (c < gap + inSec) {
    const u = ((c - gap) / inSec) * n;
    const i = Math.min(n - 1, Math.floor(u));
    return lerpPose(frames[i], frames[i + 1], ease(u - i));
  }
  if (c < gap + inSec + rest) return breathe(last, 0.8);
  return lerpPose(last, frames[0], ease((c - gap - inSec - rest) / outSec));
}

// ---------- drawable shapes ----------

/**
 * Turn a pose into positioned shapes in view coordinates. Every call for the
 * same figure yields the same keys in the same order, so a DOM renderer can
 * create elements once and then only update attributes.
 */
export function shapesFor(fig, pose, glowKeys = []) {
  const top = fig.view === 'top';
  const sol = place(fig, pose);
  const S = fig.scale;
  const T = (q) => [q[0] * S + fig.tx, q[1] * S + fig.ty];
  const shapes = [];

  if (top) {
    const mw = fig.matWidth * S;
    const mh = 66 * S;
    const c = T([fig.matCenter, (fig.bounds.y0 + fig.bounds.y1) / 2]);
    shapes.push({ key: 'mat', z: -10, tag: 'rect', cls: 'fg-mat top', attrs: { x: f(c[0] - mw / 2), y: f(c[1] - mh / 2), width: f(mw), height: f(mh), rx: f(5 * S) } });
  } else {
    const mw = fig.matWidth * S;
    const c = T([fig.matCenter, 0]);
    shapes.push({ key: 'floor', z: -11, tag: 'rect', cls: 'fg-floor', attrs: { x: '0', y: f(c[1]), width: String(VIEW_W), height: f(VIEW_H - c[1]) } });
    shapes.push({ key: 'mat', z: -10, tag: 'rect', cls: 'fg-mat', attrs: { x: f(c[0] - mw / 2), y: f(c[1] - 0.5), width: f(mw), height: f(Math.max(3, 4.5 * S)), rx: f(2 * S) } });
  }

  fig.props.forEach((pr, i) => {
    const key = 'prop' + i;
    if (pr.t === 'block' || pr.t === 'cushion') {
      const a = T([pr.x, pr.y]);
      const rx = pr.t === 'cushion' ? (pr.h * S) / 2 : 2.2 * S;
      shapes.push({ key, z: pr.z, tag: 'rect', cls: pr.t === 'cushion' ? 'fg-cushion' : 'fg-block', attrs: { x: f(a[0]), y: f(a[1]), width: f(pr.w * S), height: f(pr.h * S), rx: f(Math.min(rx, (pr.h * S) / 2)) } });
    } else if (pr.t === 'wall') {
      const a = T([pr.x, 0]);
      const x = pr.side === 'right' ? a[0] : 0;
      const w = pr.side === 'right' ? VIEW_W - a[0] : a[0];
      shapes.push({ key, z: -12, tag: 'rect', cls: 'fg-wall', attrs: { x: f(x), y: '0', width: f(Math.max(0, w)), height: f(a[1]) } });
    } else if (pr.t === 'shakti') {
      const a = T([pr.x, -pr.h]);
      const w = pr.w * S;
      const h = pr.h * S;
      shapes.push({ key, z: pr.z, tag: 'rect', cls: 'fg-shakti', attrs: { x: f(a[0]), y: f(a[1]), width: f(w), height: f(h), rx: f(Math.min(h / 2, 1.2 * S)) } });
      // a row of spikes along the top
      let d = '';
      const r = 1.05 * S;
      for (let u = 2; u < pr.w - 1; u += 3.2) d += circlePath(T([pr.x + u, -pr.h - 0.35]), r);
      shapes.push({ key: key + '-spikes', z: pr.z + 0.1, tag: 'path', cls: 'fg-spikes', attrs: { d } });
    } else if (pr.t === 'chair') {
      const y = T([0, pr.seatY])[1];
      const floor = T([0, 0])[1];
      const x0 = T([pr.x0, 0])[0];
      const x1 = T([pr.x1, 0])[0];
      let d = `M${f(x0)} ${f(y)}H${f(x1)}v${f(4 * S)}H${f(x0)}Z`;
      d += `M${f(x0 + 3 * S)} ${f(y + 4 * S)}V${f(floor)}h${f(2.6 * S)}V${f(y + 4 * S)}Z`;
      d += `M${f(x1 - 5.6 * S)} ${f(y + 4 * S)}V${f(floor)}h${f(2.6 * S)}V${f(y + 4 * S)}Z`;
      if (pr.side) {
        const bx = T([pr.backX, 0])[0];
        d += `M${f(bx - 2.6 * S)} ${f(y - 44 * S)}h${f(3 * S)}V${f(y)}h${f(-3 * S)}Z`;
      }
      shapes.push({ key, z: 1, tag: 'path', cls: 'fg-chair', attrs: { d } });
    }
  });

  const far = sol.view === 'side' ? (k) => /F$/.test(k) : () => false;
  for (const s of sol.segs) {
    const d = capsulePath(T(s.a), T(s.b), s.r0 * S, s.r1 * S);
    shapes.push({ key: s.key, z: s.z, tag: 'path', cls: far(s.key) ? 'fg-far' : 'fg-body', attrs: { d } });
  }
  // Toe spreaders: a band around the front of each foot.
  fig.props.forEach((pr, i) => {
    if (pr.t !== 'spreaders') return;
    for (const s of sol.segs) {
      if (!s.key.startsWith('foot')) continue;
      const u = 0.56;
      const a = [s.a[0] + (s.b[0] - s.a[0]) * u, s.a[1] + (s.b[1] - s.a[1]) * u];
      const r0 = s.r0 + (s.r1 - s.r0) * u + 1.2;
      const d = capsulePath(T(a), T(s.b), r0 * S, (s.r1 + 1.2) * S);
      shapes.push({ key: `prop${i}-${s.key}`, z: s.z + 0.5, tag: 'path', cls: far(s.key) ? 'fg-spreader far' : 'fg-spreader', attrs: { d } });
    }
  });
  if (sol.torso) {
    shapes.push({ key: 'torso', z: 20, tag: 'path', cls: 'fg-body fg-torso', attrs: { d: polyPath(sol.torso.poly.map(T)), 'stroke-width': f(12 * S) } });
  }
  const hc = T(sol.pts.headC);
  shapes.push({ key: 'head', z: 23, tag: 'path', cls: 'fg-body', attrs: { d: circlePath(hc, HEAD_R * S) } });
  shapes.push({ key: 'hair', z: 24, tag: 'path', cls: 'fg-hair', attrs: { d: hairPath(sol.view === 'side', hc, sol.pose.head, HEAD_R * S, sol.pose.turn || 0) } });

  fig.props.forEach((pr, i) => {
    if (pr.t !== 'strap') return;
    const a = sol.pts[pr.from];
    const b = sol.pts[pr.to];
    if (!a || !b) return;
    const A = T(a);
    const B = T(b);
    shapes.push({ key: 'prop' + i, z: pr.z, tag: 'path', cls: 'fg-strap', attrs: { d: `M${f(A[0])} ${f(A[1])}L${f(B[0])} ${f(B[1])}` } });
  });

  for (const k of glowKeys) {
    let d = null;
    const seg = sol.segs.find((s) => s.key === k);
    if (seg) d = capsulePath(T(seg.a), T(seg.b), (seg.r0 + 1.6) * S, (seg.r1 + 1.6) * S);
    else if (k === 'hip') d = circlePath(T(sol.pts.hip), 13 * S);
    else if (k.startsWith('trap')) {
      const sh = sol.pts['shoulder' + k.slice(4)];
      if (sh) d = capsulePath(T(sol.pts.neckBase), T(sh), 6.5 * S, 6.5 * S);
    } else if (k.startsWith('side')) {
      const s = k.slice(4);
      if (sol.pts['hip' + s]) d = capsulePath(T(sol.pts['hip' + s]), T(sol.pts['shoulder' + s]), 7 * S, 7 * S);
    } else if (k === 'chest' && sol.pts.shoulderL) {
      d = capsulePath(T(sol.pts.shoulderL), T(sol.pts.shoulderR), 8 * S, 8 * S);
    }
    if (d) shapes.push({ key: 'glow-' + k, z: 50, tag: 'path', cls: 'fg-glow', glow: true, attrs: { d } });
  }

  shapes.sort((a, b) => a.z - b.z);
  return shapes;
}

/**
 * A viewBox hugging the figure and its props across all frames, so small
 * containers are filled by the body rather than empty floor.
 */
export function cropBox(fig, pad = 10) {
  const S = fig.scale;
  const b = fig.bounds;
  const x0 = b.x0 * S + fig.tx - pad;
  const x1 = b.x1 * S + fig.tx + pad;
  const y0 = b.y0 * S + fig.ty - pad;
  const y1 = fig.view === 'top' ? b.y1 * S + fig.ty + pad : fig.ty + 7;
  return [x0, y0, x1 - x0, y1 - y0].map((v) => Math.round(v * 10) / 10).join(' ');
}

/** A complete, static SVG string for a figure (thumbnails, tests, tooling). */
export function figureSVG(spec, { glow = true, mirror = false, cls = '', mode = 'still', t = 0, crop = false } = {}) {
  const fig = prepareFigure(spec);
  const pose = poseAt(fig, t, mode);
  const shapes = shapesFor(fig, pose, glow ? spec.glow || [] : []);
  const el = (s) => `<${s.tag} class="${s.cls}" ${Object.entries(s.attrs).map(([k, v]) => `${k}="${v}"`).join(' ')}/>`;
  const glowing = shapes.filter((s) => s.glow);
  // Glow shapes share one group so overlaps do not stack their opacity.
  const body = shapes.filter((s) => !s.glow).map(el).join('') + (glowing.length ? `<g class="fg-glow-g">${glowing.map(el).join('')}</g>` : '');
  const flip = mirror ? ` transform="translate(${VIEW_W} 0) scale(-1 1)"` : '';
  const box = crop ? `viewBox="${cropBox(fig)}" preserveAspectRatio="xMidYMax meet"` : `viewBox="0 0 ${VIEW_W} ${VIEW_H}"`;
  return `<svg class="fig ${cls}" ${box} aria-hidden="true" focusable="false"><g${flip}>${body}</g></svg>`;
}
