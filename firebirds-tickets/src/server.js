import { openDatabase } from './db.js';
import { createAuth } from './auth.js';
import { createApp } from './app.js';

const PORT = Number(process.env.PORT) || 3000;
const DB_PATH = process.env.DB_PATH || new URL('../data/firebirds.db', import.meta.url).pathname;

if (!process.env.ADMIN_PASSWORD) {
  console.error('ADMIN_PASSWORD is not set. Set it in the environment (see .env.example).');
  process.exit(1);
}

const db = openDatabase(DB_PATH);
const auth = createAuth({
  password: process.env.ADMIN_PASSWORD,
  secret: process.env.SESSION_SECRET,
  secureCookies: process.env.SECURE_COOKIES === '1',
});
const app = createApp({ db, auth });

app.listen(PORT, () => {
  console.log(`Firebirds ticket lottery listening on http://localhost:${PORT} (db: ${DB_PATH})`);
});
