// Sync progress between devices through a secret GitHub Gist.
//
// You paste a GitHub token (classic, with only the "gist" scope) on each
// device. The app keeps one file, unstuck.json, in a secret gist on your
// account and merges it with this device's copy. The token stays in this
// browser's storage and is never part of a backup.

const API = 'https://api.github.com';
export const GIST_FILE = 'unstuck.json';
const SYNC_KEY = 'unstuck.sync';

export function loadSync() {
  try {
    const raw = localStorage.getItem(SYNC_KEY);
    const s = raw ? JSON.parse(raw) : null;
    return s && s.token ? s : null;
  } catch {
    return null;
  }
}

export function saveSync(s) {
  try {
    if (s) localStorage.setItem(SYNC_KEY, JSON.stringify(s));
    else localStorage.removeItem(SYNC_KEY);
  } catch {
    /* storage blocked: sync lasts for this visit only */
  }
}

export class SyncError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

async function call(token, path, { method = 'GET', body, fetchImpl = fetch } = {}) {
  let res;
  try {
    res = await fetchImpl(API + path, {
      method,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: 'Bearer ' + token,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });
  } catch {
    throw new SyncError('network', 'offline');
  }
  if (res.status === 401) throw new SyncError('token', 'bad token');
  if (res.status === 403 || res.status === 404) throw new SyncError('scope', 'no gist access');
  if (!res.ok) throw new SyncError('server', 'GitHub said ' + res.status);
  return res.status === 204 ? null : res.json();
}

/** Find the gist holding unstuck.json, or null. */
export async function findGist(token, opts = {}) {
  for (let page = 1; page <= 5; page++) {
    const list = await call(token, `/gists?per_page=100&page=${page}`, opts);
    const hit = list.find((g) => g.files && g.files[GIST_FILE]);
    if (hit) return hit.id;
    if (list.length < 100) break;
  }
  return null;
}

export async function createGist(token, content, opts = {}) {
  const g = await call(token, '/gists', {
    ...opts,
    method: 'POST',
    body: { description: 'Unstuck progress (kept in sync by the app)', public: false, files: { [GIST_FILE]: { content } } },
  });
  return g.id;
}

/** The saved state in the gist, or null when the file is empty or unreadable. */
export async function readGist(token, id, opts = {}) {
  const g = await call(token, '/gists/' + id, opts);
  const file = g.files && g.files[GIST_FILE];
  if (!file) return null;
  let text = file.content;
  if (file.truncated && file.raw_url) {
    const res = await (opts.fetchImpl || fetch)(file.raw_url, { cache: 'no-store' });
    text = await res.text();
  }
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function writeGist(token, id, content, opts = {}) {
  await call(token, '/gists/' + id, { ...opts, method: 'PATCH', body: { files: { [GIST_FILE]: { content } } } });
}
