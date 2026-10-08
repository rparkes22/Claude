import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase } from '../src/db.js';
import { createAuth } from '../src/auth.js';
import { createApp } from '../src/app.js';

// Freeze "now" to Oct 8, 2026 10:00 Pacific so seeded games have predictable status.
// Runs against an in-memory PGlite database (same SQL as production Postgres).
const NOW = new Date('2026-10-08T17:00:00Z');

let server, base, db, cookie = '';

before(async () => {
  db = await openDatabase();
  const auth = createAuth({ password: 'secret', secret: 'test-secret', secureCookies: false });
  const app = createApp({ getDb: async () => db, auth, now: () => NOW });
  await new Promise((resolve) => { server = app.listen(0, resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => { server.close(); await db.close(); });

beforeEach(async () => { await db.query('DELETE FROM winners'); await db.query('DELETE FROM entries'); });

async function call(method, path, body, asAdmin = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (asAdmin) headers.Cookie = cookie;
  const res = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: res.status, body: await res.json().catch(() => ({})), headers: res.headers };
}

async function login() {
  const r = await call('POST', '/api/admin/login', { password: 'secret' });
  assert.equal(r.status, 200);
  cookie = r.headers.get('set-cookie').split(';')[0];
}

async function futureGames() {
  return (await db.query("SELECT * FROM games WHERE date > '2026-10-08' ORDER BY date")).rows;
}

test('schedule lists seeded games with status', async () => {
  const r = await call('GET', '/api/schedule');
  assert.equal(r.status, 200);
  assert.ok(r.body.games.length >= 30);
  const opener = r.body.games.find((g) => g.date === '2026-10-02');
  assert.equal(opener.status, 'past');
  const next = r.body.games.find((g) => g.date === '2026-10-09');
  assert.equal(next.status, 'open');
  assert.equal(next.expected_draw_date, '2026-10-06');
  assert.ok(Array.isArray(r.body.settings.perks));
});

test('staff can enter a game once, and email is normalised', async () => {
  const [g] = await futureGames();
  let r = await call('POST', `/api/games/${g.id}/entries`, { name: 'Ada Lovelace', email: ' Ada@Example.com ' });
  assert.equal(r.status, 201);
  r = await call('POST', `/api/games/${g.id}/entries`, { name: 'Ada', email: 'ada@example.com' });
  assert.equal(r.status, 409);
  r = await call('GET', '/api/me?email=ADA@example.com');
  assert.deepEqual(r.body.entered_game_ids, [g.id]);
  assert.equal(r.body.won, null);
});

test('validation rejects bad input and past games', async () => {
  const [g] = await futureGames();
  assert.equal((await call('POST', `/api/games/${g.id}/entries`, { name: 'A', email: 'a@b.co' })).status, 400);
  assert.equal((await call('POST', `/api/games/${g.id}/entries`, { name: 'Alice', email: 'nope' })).status, 400);
  const past = (await db.query("SELECT id FROM games WHERE date = '2026-10-02'")).rows[0];
  assert.equal((await call('POST', `/api/games/${past.id}/entries`, { name: 'Alice', email: 'a@b.co' })).status, 409);
  assert.equal((await call('POST', '/api/games/99999/entries', { name: 'Alice', email: 'a@b.co' })).status, 404);
});

test('staff can withdraw an entry', async () => {
  const [g] = await futureGames();
  await call('POST', `/api/games/${g.id}/entries`, { name: 'Bob Smith', email: 'bob@x.io' });
  let r = await call('DELETE', `/api/games/${g.id}/entries`, { email: 'bob@x.io' });
  assert.equal(r.status, 200);
  r = await call('DELETE', `/api/games/${g.id}/entries`, { email: 'bob@x.io' });
  assert.equal(r.status, 404);
});

test('admin routes require login', async () => {
  assert.equal((await call('GET', '/api/admin/overview')).status, 401);
  assert.equal((await call('POST', '/api/admin/login', { password: 'wrong' })).status, 401);
  await login();
  assert.equal((await call('GET', '/api/admin/overview', undefined, true)).status, 200);
});

test('drawing picks an entrant, blocks them from future games, and removes their other entries', async () => {
  await login();
  const [g1, g2, g3] = await futureGames();
  for (const [name, email] of [['Ann', 'ann@x.io'], ['Ben', 'ben@x.io'], ['Cy', 'cy@x.io']]) {
    await call('POST', `/api/games/${g1.id}/entries`, { name, email });
    await call('POST', `/api/games/${g2.id}/entries`, { name, email });
  }
  // Nobody is eligible for g3 yet.
  assert.equal((await call('POST', `/api/admin/games/${g3.id}/draw`, undefined, true)).status, 409);

  const r = await call('POST', `/api/admin/games/${g1.id}/draw`, undefined, true);
  assert.equal(r.status, 200);
  assert.equal(r.body.winner.pool_size, 3);
  const winner = r.body.winner.email;
  assert.ok(['ann@x.io', 'ben@x.io', 'cy@x.io'].includes(winner));

  // Cannot draw twice.
  assert.equal((await call('POST', `/api/admin/games/${g1.id}/draw`, undefined, true)).status, 409);

  // Winner's other entries are gone; others remain.
  const g2Entries = (await call('GET', `/api/admin/games/${g2.id}/entries`, undefined, true)).body.entries;
  assert.equal(g2Entries.length, 2);
  assert.ok(!g2Entries.some((e) => e.email === winner));

  // Winner is blocked from new entries and sees their win.
  const blocked = await call('POST', `/api/games/${g3.id}/entries`, { name: 'Winner Person', email: winner });
  assert.equal(blocked.status, 409);
  assert.match(blocked.body.error, /already won/);
  const me = await call('GET', `/api/me?email=${winner}`);
  assert.equal(me.body.won.game_id, g1.id);

  // Public schedule shows the winner's name but not their email.
  const sched = await call('GET', '/api/schedule');
  const shown = sched.body.games.find((g) => g.id === g1.id);
  assert.equal(shown.status, 'drawn');
  assert.ok(shown.winner.name);
  assert.equal(JSON.stringify(shown).includes(winner), false);

  // Entering a drawn game is refused.
  assert.equal((await call('POST', `/api/games/${g1.id}/entries`, { name: 'Dee', email: 'dee@x.io' })).status, 409);

  // Undo re-opens eligibility.
  assert.equal((await call('DELETE', `/api/admin/games/${g1.id}/winner`, undefined, true)).status, 200);
  assert.equal((await call('POST', `/api/games/${g3.id}/entries`, { name: 'Winner Person', email: winner })).status, 201);
});

test('draw excludes entrants who won another game after entering', async () => {
  await login();
  const [g1, g2] = await futureGames();
  // Zed enters g2 first, then wins g1 via a direct winners insert (simulating a prior season state).
  await call('POST', `/api/games/${g2.id}/entries`, { name: 'Zed', email: 'zed@x.io' });
  await db.query('INSERT INTO winners (game_id, name, email, pool_size) VALUES ($1, $2, $3, 1)', [g1.id, 'Zed', 'zed@x.io']);
  assert.equal((await call('POST', `/api/admin/games/${g2.id}/draw`, undefined, true)).status, 409);
});

test('admin can add, edit, close and delete games', async () => {
  await login();
  let r = await call('POST', '/api/admin/games', { date: '2027-04-10', time: '18:00', opponent: 'Test Team', theme: 'Test Night' }, true);
  assert.equal(r.status, 201);
  const id = r.body.id;
  assert.equal((await call('POST', '/api/admin/games', { date: 'bad', time: '18:00', opponent: 'X' }, true)).status, 400);
  r = await call('PUT', `/api/admin/games/${id}`, { date: '2027-04-10', time: '18:00', opponent: 'Test Team', is_active: false }, true);
  assert.equal(r.status, 200);
  assert.equal((await call('POST', `/api/games/${id}/entries`, { name: 'Eve', email: 'eve@x.io' })).status, 409);
  const sched = await call('GET', '/api/schedule');
  assert.equal(sched.body.games.find((g) => g.id === id).status, 'closed');
  assert.equal((await call('DELETE', `/api/admin/games/${id}`, undefined, true)).status, 200);
});

test('admin can update perks and settings, and reset the season', async () => {
  await login();
  let r = await call('PUT', '/api/admin/settings', { perks: [{ icon: '🍕', title: 'Pizza', detail: 'Free slices' }, { title: '' }], draw_lead_days: 5, tickets_per_game: 4 }, true);
  assert.equal(r.status, 200);
  const s = (await call('GET', '/api/schedule')).body.settings;
  assert.deepEqual(s.perks, [{ icon: '🍕', title: 'Pizza', detail: 'Free slices' }]);
  assert.equal(s.draw_lead_days, 5);
  assert.equal(s.tickets_per_game, '4');
  assert.equal((await call('PUT', '/api/admin/settings', { draw_lead_days: 99 }, true)).status, 400);

  const [g] = await futureGames();
  await call('POST', `/api/games/${g.id}/entries`, { name: 'Fay', email: 'fay@x.io' });
  assert.equal((await call('POST', '/api/admin/reset-season', { confirm: 'nope' }, true)).status, 400);
  assert.equal((await call('POST', '/api/admin/reset-season', { confirm: 'RESET' }, true)).status, 200);
  assert.equal((await db.query('SELECT COUNT(*)::int AS n FROM entries')).rows[0].n, 0);
  // restore defaults for other tests
  await call('PUT', '/api/admin/settings', { draw_lead_days: 3 }, true);
});
