import { buildApp, getDb } from './bootstrap.js';

const PORT = Number(process.env.PORT) || 3000;

let app;
try { app = buildApp(); } catch (err) { console.error(err.message); process.exit(1); }

getDb().then(() => {
  app.listen(PORT, () => {
    const store = process.env.DATABASE_URL ? 'postgres' : `pglite (${process.env.PGLITE_DIR || 'in-memory'})`;
    console.log(`Firebirds ticket lottery listening on http://localhost:${PORT} (db: ${store})`);
  });
}).catch((err) => { console.error('Database failed to open:', err.message); process.exit(1); });
