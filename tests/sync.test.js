import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../src/js/lib/store.js';
import { GIST_FILE } from '../src/js/lib/gistsync.js';

/** A tiny fake of the GitHub gist API, shared by several "devices". */
function fakeGitHub(token) {
  const gists = new Map();
  let n = 0;
  return async (url, { method = 'GET', headers = {}, body } = {}) => {
    const reply = (status, data) => ({ ok: status < 300, status, json: async () => data, text: async () => JSON.stringify(data) });
    if (headers.Authorization !== 'Bearer ' + token) return reply(401, {});
    const path = url.replace('https://api.github.com', '');
    if (path.startsWith('/gists?')) return reply(200, [...gists.entries()].map(([id, files]) => ({ id, files })));
    if (path === '/gists' && method === 'POST') {
      const id = 'g' + ++n;
      gists.set(id, JSON.parse(body).files);
      return reply(201, { id });
    }
    const id = path.split('/')[2];
    if (method === 'PATCH') {
      Object.assign(gists.get(id), JSON.parse(body).files);
      return reply(200, {});
    }
    return reply(200, { id, files: gists.get(id) });
  };
}

const session = (id, day) => ({ id, t: Date.parse(day), day, title: 'Test', sec: 600, planned: 600, completed: true, ex: {}, before: 6, after: 3, feel: [], stuck: [], note: '' });

test('two devices with the same token end up with the same progress', async () => {
  global.fetch = fakeGitHub('tok');
  const phone = createStore();
  assert.equal(await phone.connectSync('tok'), true);
  phone.addSession(session('a', '2026-09-20'));
  await phone.syncNow();

  const laptop = createStore();
  assert.equal(await laptop.connectSync(' tok '), true, 'finds the same gist, token trimmed');
  assert.deepEqual(laptop.state.sessions.map((s) => s.id), ['a']);
  laptop.addSession(session('b', '2026-09-21'));
  await laptop.syncNow();

  await phone.syncNow();
  assert.deepEqual(phone.state.sessions.map((s) => s.id), ['a', 'b']);

  phone.removeSession('a');
  await phone.syncNow();
  await laptop.syncNow();
  assert.deepEqual(laptop.state.sessions.map((s) => s.id), ['b'], 'deletions sync too');
});

test('a wrong token is reported and nothing is connected', async () => {
  global.fetch = fakeGitHub('right');
  const s = createStore();
  assert.equal(await s.connectSync('wrong'), false);
  assert.equal(s.status.sync, 'error');
  assert.equal(s.status.syncError, 'token');
  assert.equal(s.syncConnected(), false);
  assert.ok(GIST_FILE.endsWith('.json'));
});
