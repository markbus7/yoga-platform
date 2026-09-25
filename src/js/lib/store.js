// App state and where it is saved.
//
// On claude.ai the page is given a private per-person database (`db`
// capability, under data/users/<id>/), so progress follows you across devices.
// Anywhere else it falls back to this browser's localStorage. A local copy is
// always kept so the app opens instantly.

const LOCAL_KEY = 'unstuck.v1';

export function defaultState() {
  return {
    v: 1,
    profile: { name: '', goal: 15, when: 'evening', care: [], blocks: 4, strap: false, wall: true, chair: true, spreaders: true },
    settings: { lang: '', hold: 1, voice: true, voices: { en: '', nl: '' }, rate: 1, chime: true, volume: 0.7, transition: 8, checkins: true },
    program: { startedAt: null, done: {} },
    sessions: [],
    tests: [],
    removed: [],
    updatedAt: 0,
  };
}

/** Fill in anything missing (older saves, imports). */
export function normalize(input) {
  const d = defaultState();
  const s = input && typeof input === 'object' ? input : {};
  const arr = (v) => (Array.isArray(v) ? v : []);
  const settings = { ...d.settings, ...(s.settings || {}) };
  // Older saves kept one English voice in `voiceURI`.
  settings.voices = { ...d.settings.voices, ...(settings.voices || {}) };
  if (settings.voiceURI && !settings.voices.en) settings.voices.en = settings.voiceURI;
  delete settings.voiceURI;
  return {
    v: 1,
    profile: { ...d.profile, ...(s.profile || {}) },
    settings,
    program: { ...d.program, ...(s.program || {}), done: { ...((s.program && s.program.done) || {}) } },
    sessions: arr(s.sessions).filter((x) => x && x.id && x.day),
    tests: arr(s.tests).filter((x) => x && x.id && x.results),
    removed: arr(s.removed),
    updatedAt: Number(s.updatedAt) || 0,
  };
}

/** Combine two copies (this device and the cloud). Nothing practised is ever lost. */
export function mergeStates(a, b) {
  const A = normalize(a);
  const B = normalize(b);
  const newer = B.updatedAt >= A.updatedAt ? B : A;
  const removed = [...new Set([...A.removed, ...B.removed])];
  const gone = new Set(removed);
  const byId = (xs, ys) => {
    const m = new Map();
    for (const x of [...xs, ...ys]) if (!gone.has(x.id)) m.set(x.id, x);
    return [...m.values()].sort((p, q) => p.t - q.t);
  };
  return {
    v: 1,
    profile: newer.profile,
    settings: newer.settings,
    program: { ...newer.program, done: { ...A.program.done, ...B.program.done } },
    sessions: byId(A.sessions, B.sessions),
    tests: byId(A.tests, B.tests),
    removed,
    updatedAt: Math.max(A.updatedAt, B.updatedAt),
  };
}

export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function readLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? normalize(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function createStore() {
  let state = readLocal() || defaultState();
  const subs = new Set();
  const status = { where: 'local', localOk: true };
  let cloud = null;
  const dirty = new Set();
  let timer = 0;
  let writing = false;

  const emit = () => subs.forEach((fn) => fn(state));

  function saveLocal() {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
      status.localOk = true;
    } catch {
      status.localOk = false;
    }
  }

  const monthsOf = (sessions) => [...new Set(sessions.map((s) => 'log-' + s.day.slice(0, 7)))];

  function docFor(key) {
    if (key === 'profile') {
      return { v: 1, profile: state.profile, settings: state.settings, program: state.program, tests: state.tests, removed: state.removed, updatedAt: state.updatedAt };
    }
    const month = key.slice(4);
    return { month, sessions: state.sessions.filter((s) => s.day.startsWith(month)) };
  }

  function markDirty(keys) {
    if (!cloud) return;
    keys.forEach((k) => dirty.add(k));
    clearTimeout(timer);
    timer = setTimeout(flush, 800);
  }

  async function flush() {
    if (!cloud || writing || !dirty.size) return;
    writing = true;
    const keys = [...dirty];
    dirty.clear();
    for (const key of keys) {
      try {
        await cloud.db.doc(`data/users/${cloud.uid}/${key}`).set(docFor(key));
      } catch (e) {
        const code = e && e.code;
        if (code === 'invalid_argument' || code === 'revoked' || code === 'not_granted' || code === 'capability_disabled') {
          cloud = null;
          status.where = 'local';
          emit();
          break;
        }
        dirty.add(key);
      }
    }
    writing = false;
    if (dirty.size && cloud) timer = setTimeout(flush, 4000);
  }

  function change(mutate, keys) {
    mutate(state);
    state.updatedAt = Date.now();
    saveLocal();
    markDirty(keys);
    emit();
  }

  return {
    get state() {
      return state;
    },
    status,
    subscribe(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
    /** Change profile, settings, program or tests. */
    update(mutate) {
      change(mutate, ['profile']);
    },
    addSession(session, mutate) {
      change((s) => {
        s.sessions.push(session);
        if (mutate) mutate(s);
      }, ['profile', 'log-' + session.day.slice(0, 7)]);
    },
    removeSession(id) {
      const found = state.sessions.find((s) => s.id === id);
      if (!found) return;
      change((s) => {
        s.sessions = s.sessions.filter((x) => x.id !== id);
        s.removed.push(id);
      }, ['profile', 'log-' + found.day.slice(0, 7)]);
    },
    /** Replace everything (import or reset). */
    replace(next) {
      const before = monthsOf(state.sessions);
      const removed = [...state.removed, ...state.sessions.map((x) => x.id)];
      state = normalize(next);
      const keep = new Set(state.sessions.map((x) => x.id));
      state.removed = [...new Set([...state.removed, ...removed.filter((id) => !keep.has(id))])];
      state.updatedAt = Date.now();
      saveLocal();
      markDirty(['profile', ...new Set([...before, ...monthsOf(state.sessions)])]);
      emit();
    },
    exportJSON() {
      return JSON.stringify({ app: 'unstuck', exportedAt: new Date().toISOString(), ...state }, null, 1);
    },
    /** Connect to the per-person database when running on claude.ai. */
    async connectCloud() {
      const c = typeof window !== 'undefined' ? window.claude : null;
      if (!c || typeof c.use !== 'function') return false;
      let db;
      let user;
      try {
        [db, user] = await Promise.all([c.use('db'), c.use('user')]);
      } catch {
        return false;
      }
      if (!db || !user) return false;
      let uid = null;
      try {
        uid = await user.id();
      } catch {
        uid = null;
      }
      if (!uid) return false;
      try {
        const snap = await db.collection(`data/users/${uid}`).get();
        const docs = {};
        for (const d of snap.docs) if (d.exists) docs[d.id] = d.data();
        const remote = docs.profile ? normalize({ ...docs.profile, sessions: Object.entries(docs).filter(([k]) => k.startsWith('log-')).flatMap(([, v]) => v.sessions || []) }) : null;
        cloud = { db, uid };
        status.where = 'cloud';
        // Only write back what the cloud copy is missing; opening the app alone writes nothing.
        let need = [];
        if (remote) {
          const merged = mergeStates(state, remote);
          const remoteIds = new Set(remote.sessions.map((x) => x.id));
          const gone = new Set(merged.removed);
          need = [
            ...monthsOf(merged.sessions.filter((x) => !remoteIds.has(x.id))),
            ...monthsOf(remote.sessions.filter((x) => gone.has(x.id))),
          ];
          const profileBehind =
            state.updatedAt > remote.updatedAt ||
            Object.keys(merged.program.done).length > Object.keys(remote.program.done).length ||
            merged.tests.length > remote.tests.length ||
            merged.removed.length > remote.removed.length;
          if (profileBehind) need.push('profile');
          state = merged;
        } else if (state.updatedAt) {
          need = ['profile', ...monthsOf(state.sessions)];
        }
        saveLocal();
        markDirty([...new Set(need)]);
        emit();
        return true;
      } catch {
        cloud = null;
        status.where = 'local';
        return false;
      }
    },
  };
}
