import express from 'express';
import { randomInt } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { addDays, gameHasStarted, isValidDate, isValidTime, nowInPacific } from './time.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME = 80;
const MAX_TEXT = 200;

/**
 * @param {object} opts
 * @param {() => Promise<import('./db.js').Db>} opts.getDb  resolves the (lazily opened) database
 * @param {object} opts.auth
 * @param {() => Date} [opts.now]
 */
export function createApp({ getDb, auth, now = () => new Date() }) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '64kb' }));

  // Wrap async handlers so rejections reach the error middleware.
  const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

  // ---------- queries ----------
  const one = async (db, sql, params) => (await db.query(sql, params)).rows[0] ?? null;
  const all = async (db, sql, params) => (await db.query(sql, params)).rows;

  const SQL = {
    games: `
      SELECT g.*,
        (SELECT COUNT(*)::int FROM entries e WHERE e.game_id = g.id) AS entry_count,
        w.name AS winner_name, w.email AS winner_email, w.drawn_at, w.pool_size
      FROM games g LEFT JOIN winners w ON w.game_id = g.id
      ORDER BY g.date, g.time`,
    game: 'SELECT * FROM games WHERE id = $1',
    winnerForGame: 'SELECT * FROM winners WHERE game_id = $1',
    winnerByEmail: 'SELECT * FROM winners WHERE email = $1',
    entry: 'SELECT * FROM entries WHERE game_id = $1 AND email = $2',
    entriesForGame: 'SELECT id, name, email, created_at FROM entries WHERE game_id = $1 ORDER BY created_at, id',
    winners: 'SELECT w.*, g.date, g.time, g.opponent FROM winners w JOIN games g ON g.id = w.game_id ORDER BY g.date',
  };

  async function settings(db) {
    const out = {};
    for (const row of await all(db, 'SELECT key, value FROM settings')) out[row.key] = row.value;
    out.draw_lead_days = Math.max(0, parseInt(out.draw_lead_days, 10) || 0);
    try { out.perks = JSON.parse(out.perks || '[]'); } catch { out.perks = []; }
    return out;
  }

  const normalizeEmail = (s) => String(s ?? '').trim().toLowerCase();
  const cleanText = (s, max = MAX_TEXT) => String(s ?? '').trim().replace(/\s+/g, ' ').slice(0, max);
  const idParam = (s) => { const n = Number(s); return Number.isInteger(n) && n > 0 ? n : -1; };

  function describeGame(g, cfg) {
    const started = gameHasStarted(g, now());
    let status;
    if (g.winner_name) status = 'drawn';
    else if (started) status = 'past';
    else if (!g.is_active) status = 'closed';
    else status = 'open';
    return {
      id: g.id, date: g.date, time: g.time, opponent: g.opponent, theme: g.theme,
      giveaway: g.giveaway, notes: g.notes, is_active: !!g.is_active,
      entry_count: g.entry_count, status, expected_draw_date: addDays(g.date, -cfg.draw_lead_days),
      winner: g.winner_name ? { name: g.winner_name, drawn_at: g.drawn_at, pool_size: g.pool_size } : null,
    };
  }

  function publicSettings(cfg) {
    const { season_label, intro_text, perks, draw_lead_days, tickets_per_game } = cfg;
    return { season_label, intro_text, perks, draw_lead_days, tickets_per_game };
  }

  // ---------- public API ----------
  app.get('/api/health', h(async (_req, res) => { await (await getDb()).query('SELECT 1'); res.json({ ok: true }); }));

  app.get('/api/schedule', h(async (_req, res) => {
    const db = await getDb();
    const cfg = await settings(db);
    res.json({ settings: publicSettings(cfg), games: (await all(db, SQL.games)).map((g) => describeGame(g, cfg)), today: nowInPacific(now()).date });
  }));

  app.get('/api/me', h(async (req, res) => {
    const email = normalizeEmail(req.query.email);
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Enter a valid email address' });
    const db = await getDb();
    const win = await one(db, SQL.winnerByEmail, [email]);
    let won = null;
    if (win) {
      const g = await one(db, SQL.game, [win.game_id]);
      won = { game_id: win.game_id, date: g?.date, opponent: g?.opponent, drawn_at: win.drawn_at };
    }
    const entered = await all(db, 'SELECT game_id FROM entries WHERE email = $1', [email]);
    res.json({ email, entered_game_ids: entered.map((r) => r.game_id), won });
  }));

  app.post('/api/games/:id/entries', h(async (req, res) => {
    const db = await getDb();
    const game = await one(db, SQL.game, [idParam(req.params.id)]);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    const name = cleanText(req.body?.name, MAX_NAME);
    const email = normalizeEmail(req.body?.email);
    if (name.length < 2) return res.status(400).json({ error: 'Enter your name' });
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Enter a valid work email address' });
    if (!game.is_active) return res.status(409).json({ error: 'Entries for this game are closed' });
    if (await one(db, SQL.winnerForGame, [game.id])) return res.status(409).json({ error: 'A winner has already been drawn for this game' });
    if (gameHasStarted(game, now())) return res.status(409).json({ error: 'This game has already been played' });
    const prior = await one(db, SQL.winnerByEmail, [email]);
    if (prior) {
      const g = await one(db, SQL.game, [prior.game_id]);
      return res.status(409).json({ error: `You already won tickets for ${g?.opponent ?? 'a game'} on ${g?.date ?? ''}. One win per person per season so everyone gets a turn.` });
    }
    if (await one(db, SQL.entry, [game.id, email])) return res.status(409).json({ error: "You're already entered for this game" });
    await db.query('INSERT INTO entries (game_id, name, email) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [game.id, name, email]);
    res.status(201).json({ ok: true, game_id: game.id, email });
  }));

  app.delete('/api/games/:id/entries', h(async (req, res) => {
    const db = await getDb();
    const game = await one(db, SQL.game, [idParam(req.params.id)]);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    const email = normalizeEmail(req.body?.email ?? req.query.email);
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Enter a valid email address' });
    if (await one(db, SQL.winnerForGame, [game.id])) return res.status(409).json({ error: 'A winner has already been drawn for this game' });
    const r = await db.query('DELETE FROM entries WHERE game_id = $1 AND email = $2', [game.id, email]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'No entry found for that email' });
    res.json({ ok: true });
  }));

  // ---------- admin auth ----------
  app.post('/api/admin/login', (req, res) => {
    if (!auth.checkPassword(req.body?.password)) return res.status(401).json({ error: 'Wrong password' });
    auth.setCookie(res, auth.issueToken());
    res.json({ ok: true });
  });
  app.post('/api/admin/logout', (_req, res) => { auth.clearCookie(res); res.json({ ok: true }); });
  app.get('/api/admin/session', (req, res) => res.json({ admin: auth.isAdmin(req) }));

  const admin = express.Router();
  admin.use(auth.requireAdmin);

  admin.get('/overview', h(async (_req, res) => {
    const db = await getDb();
    const cfg = await settings(db);
    const games = (await all(db, SQL.games)).map((g) => ({ ...describeGame(g, cfg), winner_email: g.winner_email }));
    res.json({ settings: cfg, games, winners: await all(db, SQL.winners), today: nowInPacific(now()).date });
  }));

  admin.get('/games/:id/entries', h(async (req, res) => {
    const db = await getDb();
    const game = await one(db, SQL.game, [idParam(req.params.id)]);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    res.json({ game, entries: await all(db, SQL.entriesForGame, [game.id]), winner: await one(db, SQL.winnerForGame, [game.id]) });
  }));

  admin.delete('/games/:id/entries/:entryId', h(async (req, res) => {
    const db = await getDb();
    const r = await db.query('DELETE FROM entries WHERE id = $1 AND game_id = $2', [idParam(req.params.entryId), idParam(req.params.id)]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Entry not found' });
    res.json({ ok: true });
  }));

  // ---------- admin: the drawing ----------
  admin.post('/games/:id/draw', h(async (req, res) => {
    const db = await getDb();
    const game = await one(db, SQL.game, [idParam(req.params.id)]);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    if (await one(db, SQL.winnerForGame, [game.id])) return res.status(409).json({ error: 'A winner has already been drawn for this game' });

    // Eligible pool: entered for this game and has not already won this season.
    const pool = await all(db, `
      SELECT e.id, e.name, e.email FROM entries e
      WHERE e.game_id = $1 AND NOT EXISTS (SELECT 1 FROM winners w WHERE w.email = e.email)
      ORDER BY e.id`, [game.id]);
    if (pool.length === 0) return res.status(409).json({ error: 'No eligible entries for this game' });

    const pick = pool[randomInt(pool.length)];
    await db.tx(async (q) => {
      await q('INSERT INTO winners (game_id, name, email, pool_size) VALUES ($1, $2, $3, $4)', [game.id, pick.name, pick.email, pool.length]);
      // Winners are out of the running for every other game this season.
      await q('DELETE FROM entries WHERE email = $1 AND game_id <> $2', [pick.email, game.id]);
    });
    res.json({ ok: true, winner: { name: pick.name, email: pick.email, pool_size: pool.length } });
  }));

  admin.delete('/games/:id/winner', h(async (req, res) => {
    const db = await getDb();
    const r = await db.query('DELETE FROM winners WHERE game_id = $1', [idParam(req.params.id)]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'No winner recorded for this game' });
    res.json({ ok: true });
  }));

  // ---------- admin: games ----------
  function parseGame(body) {
    const date = String(body?.date ?? '').trim();
    const time = String(body?.time ?? '').trim();
    const opponent = cleanText(body?.opponent, MAX_NAME);
    if (!isValidDate(date)) return { error: 'Date must be YYYY-MM-DD' };
    if (!isValidTime(time)) return { error: 'Time must be HH:MM (24h)' };
    if (!opponent) return { error: 'Opponent is required' };
    return { value: [date, time, opponent, cleanText(body?.theme), cleanText(body?.giveaway), cleanText(body?.notes, 500), body?.is_active !== false] };
  }

  admin.post('/games', h(async (req, res) => {
    const p = parseGame(req.body);
    if (p.error) return res.status(400).json({ error: p.error });
    const db = await getDb();
    const row = await one(db, 'INSERT INTO games (date, time, opponent, theme, giveaway, notes, is_active) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id', p.value);
    res.status(201).json({ ok: true, id: row.id });
  }));

  admin.put('/games/:id', h(async (req, res) => {
    const id = idParam(req.params.id);
    const db = await getDb();
    if (!(await one(db, SQL.game, [id]))) return res.status(404).json({ error: 'Game not found' });
    const p = parseGame(req.body);
    if (p.error) return res.status(400).json({ error: p.error });
    await db.query('UPDATE games SET date=$1, time=$2, opponent=$3, theme=$4, giveaway=$5, notes=$6, is_active=$7 WHERE id=$8', [...p.value, id]);
    res.json({ ok: true });
  }));

  admin.delete('/games/:id', h(async (req, res) => {
    const db = await getDb();
    const r = await db.query('DELETE FROM games WHERE id = $1', [idParam(req.params.id)]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Game not found' });
    res.json({ ok: true });
  }));

  // ---------- admin: settings ----------
  admin.put('/settings', h(async (req, res) => {
    const b = req.body ?? {};
    const updates = {};
    if (b.season_label !== undefined) updates.season_label = cleanText(b.season_label, MAX_NAME);
    if (b.intro_text !== undefined) updates.intro_text = String(b.intro_text).trim().slice(0, 1000);
    if (b.tickets_per_game !== undefined) updates.tickets_per_game = String(Math.max(1, parseInt(b.tickets_per_game, 10) || 1));
    if (b.draw_lead_days !== undefined) {
      const n = parseInt(b.draw_lead_days, 10);
      if (!Number.isFinite(n) || n < 0 || n > 60) return res.status(400).json({ error: 'Draw lead days must be between 0 and 60' });
      updates.draw_lead_days = String(n);
    }
    if (b.perks !== undefined) {
      if (!Array.isArray(b.perks) || b.perks.length > 20) return res.status(400).json({ error: 'Perks must be a list of up to 20 items' });
      const perks = b.perks.map((p) => ({ icon: cleanText(p?.icon, 8), title: cleanText(p?.title, MAX_NAME), detail: cleanText(p?.detail, 300) })).filter((p) => p.title);
      updates.perks = JSON.stringify(perks);
    }
    const db = await getDb();
    for (const [k, v] of Object.entries(updates)) {
      await db.query('INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value', [k, v]);
    }
    res.json({ ok: true, settings: await settings(db) });
  }));

  admin.post('/reset-season', h(async (req, res) => {
    if (req.body?.confirm !== 'RESET') return res.status(400).json({ error: 'Send {"confirm":"RESET"} to wipe entries and winners' });
    const db = await getDb();
    await db.tx(async (q) => { await q('DELETE FROM winners'); await q('DELETE FROM entries'); });
    res.json({ ok: true });
  }));

  app.use('/api/admin', admin);

  // ---------- static (used when running as a plain Node server; Vercel serves public/ itself) ----------
  app.use(express.static(PUBLIC_DIR, { extensions: ['html'] }));
  app.get('/admin', (_req, res) => res.sendFile(join(PUBLIC_DIR, 'admin.html')));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  });

  return app;
}
