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

export function createApp({ db, auth, now = () => new Date() }) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '64kb' }));

  // ---------- helpers ----------
  const q = {
    settings: db.prepare('SELECT key, value FROM settings'),
    setSetting: db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'),
    games: db.prepare(`
      SELECT g.*,
        (SELECT COUNT(*) FROM entries e WHERE e.game_id = g.id) AS entry_count,
        w.name AS winner_name, w.email AS winner_email, w.drawn_at, w.pool_size
      FROM games g LEFT JOIN winners w ON w.game_id = g.id
      ORDER BY g.date, g.time`),
    game: db.prepare('SELECT * FROM games WHERE id = ?'),
    winnerForGame: db.prepare('SELECT * FROM winners WHERE game_id = ?'),
    winnerByEmail: db.prepare('SELECT * FROM winners WHERE email = ?'),
    entry: db.prepare('SELECT * FROM entries WHERE game_id = ? AND email = ?'),
    entriesForGame: db.prepare('SELECT id, name, email, created_at FROM entries WHERE game_id = ? ORDER BY created_at'),
    entriesForEmail: db.prepare(`
      SELECT e.game_id, e.created_at FROM entries e WHERE e.email = ?`),
    insertEntry: db.prepare('INSERT INTO entries (game_id, name, email) VALUES (?, ?, ?)'),
    deleteEntry: db.prepare('DELETE FROM entries WHERE game_id = ? AND email = ?'),
    deleteEntryById: db.prepare('DELETE FROM entries WHERE id = ? AND game_id = ?'),
    deleteOtherEntriesForEmail: db.prepare('DELETE FROM entries WHERE email = ? AND game_id != ?'),
    insertWinner: db.prepare('INSERT INTO winners (game_id, name, email, pool_size) VALUES (?, ?, ?, ?)'),
    deleteWinner: db.prepare('DELETE FROM winners WHERE game_id = ?'),
    winners: db.prepare(`
      SELECT w.*, g.date, g.time, g.opponent FROM winners w JOIN games g ON g.id = w.game_id ORDER BY g.date`),
    insertGame: db.prepare('INSERT INTO games (date, time, opponent, theme, giveaway, notes, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)'),
    updateGame: db.prepare('UPDATE games SET date = ?, time = ?, opponent = ?, theme = ?, giveaway = ?, notes = ?, is_active = ? WHERE id = ?'),
    deleteGame: db.prepare('DELETE FROM games WHERE id = ?'),
  };

  function settings() {
    const out = {};
    for (const row of q.settings.all()) out[row.key] = row.value;
    out.draw_lead_days = Math.max(0, parseInt(out.draw_lead_days, 10) || 0);
    try { out.perks = JSON.parse(out.perks || '[]'); } catch { out.perks = []; }
    return out;
  }

  function normalizeEmail(s) {
    return String(s ?? '').trim().toLowerCase();
  }

  function cleanText(s, max = MAX_TEXT) {
    return String(s ?? '').trim().replace(/\s+/g, ' ').slice(0, max);
  }

  /** Status for the public schedule. */
  function describeGame(g, cfg) {
    const started = gameHasStarted(g, now());
    const drawDate = addDays(g.date, -cfg.draw_lead_days);
    let status;
    if (g.winner_name) status = 'drawn';
    else if (started) status = 'past';
    else if (!g.is_active) status = 'closed';
    else status = 'open';
    return {
      id: g.id, date: g.date, time: g.time, opponent: g.opponent, theme: g.theme,
      giveaway: g.giveaway, notes: g.notes, is_active: !!g.is_active,
      entry_count: g.entry_count, status, expected_draw_date: drawDate,
      winner: g.winner_name ? { name: g.winner_name, drawn_at: g.drawn_at, pool_size: g.pool_size } : null,
    };
  }

  function publicSettings(cfg) {
    const { season_label, intro_text, perks, draw_lead_days, tickets_per_game } = cfg;
    return { season_label, intro_text, perks, draw_lead_days, tickets_per_game };
  }

  // ---------- public API ----------
  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  app.get('/api/schedule', (_req, res) => {
    const cfg = settings();
    res.json({ settings: publicSettings(cfg), games: q.games.all().map((g) => describeGame(g, cfg)), today: nowInPacific(now()).date });
  });

  // What has this email entered, and have they already won?
  app.get('/api/me', (req, res) => {
    const email = normalizeEmail(req.query.email);
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Enter a valid email address' });
    const win = q.winnerByEmail.get(email);
    let won = null;
    if (win) {
      const g = q.game.get(win.game_id);
      won = { game_id: win.game_id, date: g?.date, opponent: g?.opponent, drawn_at: win.drawn_at };
    }
    res.json({ email, entered_game_ids: q.entriesForEmail.all(email).map((r) => r.game_id), won });
  });

  app.post('/api/games/:id/entries', (req, res) => {
    const game = q.game.get(Number(req.params.id));
    if (!game) return res.status(404).json({ error: 'Game not found' });
    const name = cleanText(req.body?.name, MAX_NAME);
    const email = normalizeEmail(req.body?.email);
    if (name.length < 2) return res.status(400).json({ error: 'Enter your name' });
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Enter a valid work email address' });
    if (!game.is_active) return res.status(409).json({ error: 'Entries for this game are closed' });
    if (q.winnerForGame.get(game.id)) return res.status(409).json({ error: 'A winner has already been drawn for this game' });
    if (gameHasStarted(game, now())) return res.status(409).json({ error: 'This game has already been played' });
    const prior = q.winnerByEmail.get(email);
    if (prior) {
      const g = q.game.get(prior.game_id);
      return res.status(409).json({ error: `You already won tickets for ${g?.opponent ?? 'a game'} on ${g?.date ?? ''}. One win per person per season so everyone gets a turn.` });
    }
    if (q.entry.get(game.id, email)) return res.status(409).json({ error: "You're already entered for this game" });
    q.insertEntry.run(game.id, name, email);
    res.status(201).json({ ok: true, game_id: game.id, email });
  });

  app.delete('/api/games/:id/entries', (req, res) => {
    const game = q.game.get(Number(req.params.id));
    if (!game) return res.status(404).json({ error: 'Game not found' });
    const email = normalizeEmail(req.body?.email ?? req.query.email);
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Enter a valid email address' });
    if (q.winnerForGame.get(game.id)) return res.status(409).json({ error: 'A winner has already been drawn for this game' });
    const r = q.deleteEntry.run(game.id, email);
    if (r.changes === 0) return res.status(404).json({ error: 'No entry found for that email' });
    res.json({ ok: true });
  });

  // ---------- admin auth ----------
  app.post('/api/admin/login', (req, res) => {
    if (!auth.checkPassword(req.body?.password)) return res.status(401).json({ error: 'Wrong password' });
    auth.setCookie(res, auth.issueToken());
    res.json({ ok: true });
  });

  app.post('/api/admin/logout', (_req, res) => {
    auth.clearCookie(res);
    res.json({ ok: true });
  });

  app.get('/api/admin/session', (req, res) => res.json({ admin: auth.isAdmin(req) }));

  const admin = express.Router();
  admin.use(auth.requireAdmin);

  // ---------- admin: overview ----------
  admin.get('/overview', (_req, res) => {
    const cfg = settings();
    const games = q.games.all().map((g) => ({ ...describeGame(g, cfg), winner_email: g.winner_email }));
    res.json({ settings: cfg, games, winners: q.winners.all(), today: nowInPacific(now()).date });
  });

  admin.get('/games/:id/entries', (req, res) => {
    const game = q.game.get(Number(req.params.id));
    if (!game) return res.status(404).json({ error: 'Game not found' });
    res.json({ game, entries: q.entriesForGame.all(game.id), winner: q.winnerForGame.get(game.id) ?? null });
  });

  admin.delete('/games/:id/entries/:entryId', (req, res) => {
    const r = q.deleteEntryById.run(Number(req.params.entryId), Number(req.params.id));
    if (r.changes === 0) return res.status(404).json({ error: 'Entry not found' });
    res.json({ ok: true });
  });

  // ---------- admin: the drawing ----------
  admin.post('/games/:id/draw', (req, res) => {
    const game = q.game.get(Number(req.params.id));
    if (!game) return res.status(404).json({ error: 'Game not found' });
    if (q.winnerForGame.get(game.id)) return res.status(409).json({ error: 'A winner has already been drawn for this game' });

    // Eligible pool: entered for this game and has not already won this season.
    const pool = q.entriesForGame.all(game.id).filter((e) => !q.winnerByEmail.get(e.email));
    if (pool.length === 0) return res.status(409).json({ error: 'No eligible entries for this game' });

    const pick = pool[randomInt(pool.length)];
    const run = db.prepare('BEGIN');
    run.run();
    try {
      q.insertWinner.run(game.id, pick.name, pick.email, pool.length);
      // Winners are out of the running for every other game this season.
      q.deleteOtherEntriesForEmail.run(pick.email, game.id);
      db.prepare('COMMIT').run();
    } catch (err) {
      db.prepare('ROLLBACK').run();
      throw err;
    }
    res.json({ ok: true, winner: { name: pick.name, email: pick.email, pool_size: pool.length } });
  });

  // Undo a draw (e.g. winner can't attend). Their entries for other games are not restored.
  admin.delete('/games/:id/winner', (req, res) => {
    const r = q.deleteWinner.run(Number(req.params.id));
    if (r.changes === 0) return res.status(404).json({ error: 'No winner recorded for this game' });
    res.json({ ok: true });
  });

  // ---------- admin: games ----------
  function parseGame(body) {
    const date = String(body?.date ?? '').trim();
    const time = String(body?.time ?? '').trim();
    const opponent = cleanText(body?.opponent, MAX_NAME);
    if (!isValidDate(date)) return { error: 'Date must be YYYY-MM-DD' };
    if (!isValidTime(time)) return { error: 'Time must be HH:MM (24h)' };
    if (!opponent) return { error: 'Opponent is required' };
    return {
      value: [date, time, opponent, cleanText(body?.theme), cleanText(body?.giveaway), cleanText(body?.notes, 500), body?.is_active === false ? 0 : 1],
    };
  }

  admin.post('/games', (req, res) => {
    const p = parseGame(req.body);
    if (p.error) return res.status(400).json({ error: p.error });
    const r = q.insertGame.run(...p.value);
    res.status(201).json({ ok: true, id: Number(r.lastInsertRowid) });
  });

  admin.put('/games/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!q.game.get(id)) return res.status(404).json({ error: 'Game not found' });
    const p = parseGame(req.body);
    if (p.error) return res.status(400).json({ error: p.error });
    q.updateGame.run(...p.value, id);
    res.json({ ok: true });
  });

  admin.delete('/games/:id', (req, res) => {
    const r = q.deleteGame.run(Number(req.params.id));
    if (r.changes === 0) return res.status(404).json({ error: 'Game not found' });
    res.json({ ok: true });
  });

  // ---------- admin: settings ----------
  admin.put('/settings', (req, res) => {
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
      const perks = b.perks.map((p) => ({ icon: cleanText(p?.icon, 8), title: cleanText(p?.title, MAX_NAME), detail: cleanText(p?.detail, 300) }))
        .filter((p) => p.title);
      updates.perks = JSON.stringify(perks);
    }
    for (const [k, v] of Object.entries(updates)) q.setSetting.run(k, v);
    res.json({ ok: true, settings: settings() });
  });

  // Wipe all entries and winners (keeps games and settings). Requires explicit confirmation.
  admin.post('/reset-season', (req, res) => {
    if (req.body?.confirm !== 'RESET') return res.status(400).json({ error: 'Send {"confirm":"RESET"} to wipe entries and winners' });
    db.exec('DELETE FROM winners; DELETE FROM entries;');
    res.json({ ok: true });
  });

  app.use('/api/admin', admin);

  // ---------- static ----------
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
