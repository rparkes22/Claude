// Shared setup for the Node server and the Vercel function: opens the database once
// per process (lazily) and builds the Express app.
import { openDatabase } from './db.js';
import { createAuth } from './auth.js';
import { createApp } from './app.js';

let dbPromise;
export function getDb() {
  dbPromise ??= openDatabase({ url: process.env.DATABASE_URL, pgliteDir: process.env.PGLITE_DIR }).catch((err) => {
    dbPromise = undefined; // allow a retry on the next request
    throw err;
  });
  return dbPromise;
}

export function buildApp() {
  if (!process.env.ADMIN_PASSWORD) throw new Error('ADMIN_PASSWORD is not set (see .env.example)');
  const auth = createAuth({
    password: process.env.ADMIN_PASSWORD,
    secret: process.env.SESSION_SECRET,
    secureCookies: process.env.SECURE_COOKIES === '1' || !!process.env.VERCEL,
  });
  return createApp({ getDb, auth });
}
