// Storage layer. Uses Postgres (pg) when DATABASE_URL is set, otherwise an embedded
// PGlite database (in-memory, or on disk when PGLITE_DIR is set) for local dev and tests.
// Both expose the same tiny interface: query(sql, params) -> { rows, rowCount } and tx(fn).
import { GAMES, DEFAULT_SETTINGS } from './seed.js';

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS games (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    opponent TEXT NOT NULL,
    theme TEXT NOT NULL DEFAULT '',
    giveaway TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS games_date ON games(date);

  CREATE TABLE IF NOT EXISTS entries (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(game_id, email)
  );
  CREATE INDEX IF NOT EXISTS entries_email ON entries(email);

  CREATE TABLE IF NOT EXISTS winners (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    game_id INTEGER NOT NULL UNIQUE REFERENCES games(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    pool_size INTEGER NOT NULL,
    drawn_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS winners_email ON winners(email);

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`;

export async function openDatabase({ url, pgliteDir } = {}) {
  const db = url ? await openPostgres(url) : await openPglite(pgliteDir);
  await db.query(SCHEMA);
  await seedIfEmpty(db);
  return db;
}

async function openPostgres(connectionString) {
  const { default: pg } = await import('pg');
  const pool = new pg.Pool({
    connectionString,
    max: 3,
    ssl: /localhost|127\.0\.0\.1/.test(connectionString) ? undefined : { rejectUnauthorized: false },
  });
  return {
    kind: 'postgres',
    query: (sql, params = []) => pool.query(sql, params),
    async tx(fn) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const out = await fn((sql, params = []) => client.query(sql, params));
        await client.query('COMMIT');
        return out;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    },
    close: () => pool.end(),
  };
}

async function openPglite(dir) {
  const { PGlite } = await import('@electric-sql/pglite');
  const pg = dir ? new PGlite(dir) : new PGlite();
  await pg.waitReady;
  const q = async (sql, params = []) => {
    const r = await pg.query(sql, params);
    return { rows: r.rows, rowCount: r.affectedRows ?? r.rows.length };
  };
  return {
    kind: 'pglite',
    query: (sql, params = []) => (params.length ? q(sql, params) : pg.exec(sql).then((rs) => { const r = rs[rs.length - 1]; return { rows: r?.rows ?? [], rowCount: r?.affectedRows ?? 0 }; })),
    tx: (fn) => pg.transaction((t) => fn(async (sql, params = []) => { const r = await t.query(sql, params); return { rows: r.rows, rowCount: r.affectedRows ?? r.rows.length }; })),
    close: () => pg.close(),
  };
}

async function seedIfEmpty(db) {
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await db.query('INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING', [key, value]);
  }
  const { rows } = await db.query('SELECT COUNT(*)::int AS n FROM games');
  if (rows[0].n > 0) return;
  for (const g of GAMES) {
    await db.query(
      'INSERT INTO games (date, time, opponent, theme, giveaway, notes) VALUES ($1, $2, $3, $4, $5, $6)',
      [g.date, g.time, g.opponent, g.theme ?? '', g.giveaway ?? '', g.notes ?? ''],
    );
  }
}
