import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const COOKIE = 'fb_admin';
const TTL_MS = 12 * 60 * 60 * 1000;

export function createAuth({ password, secret, secureCookies }) {
  if (!password) throw new Error('ADMIN_PASSWORD must be set');
  const key = secret || randomBytes(32).toString('hex');

  function sign(payload) {
    return createHmac('sha256', key).update(payload).digest('base64url');
  }

  function issueToken() {
    const payload = `${Date.now() + TTL_MS}.${randomBytes(8).toString('hex')}`;
    return `${payload}.${sign(payload)}`;
  }

  function verifyToken(token) {
    if (typeof token !== 'string') return false;
    const i = token.lastIndexOf('.');
    if (i < 0) return false;
    const payload = token.slice(0, i);
    const sig = Buffer.from(token.slice(i + 1));
    const expected = Buffer.from(sign(payload));
    if (sig.length !== expected.length || !timingSafeEqual(sig, expected)) return false;
    const expires = Number(payload.split('.')[0]);
    return Number.isFinite(expires) && expires > Date.now();
  }

  function checkPassword(candidate) {
    if (typeof candidate !== 'string') return false;
    const a = Buffer.from(candidate);
    const b = Buffer.from(password);
    return a.length === b.length && timingSafeEqual(a, b);
  }

  function readCookie(req) {
    const header = req.headers.cookie || '';
    for (const part of header.split(';')) {
      const [k, ...rest] = part.trim().split('=');
      if (k === COOKIE) return decodeURIComponent(rest.join('='));
    }
    return null;
  }

  function setCookie(res, token) {
    const attrs = [`${COOKIE}=${encodeURIComponent(token)}`, 'Path=/', 'HttpOnly', 'SameSite=Strict', `Max-Age=${TTL_MS / 1000}`];
    if (secureCookies) attrs.push('Secure');
    res.setHeader('Set-Cookie', attrs.join('; '));
  }

  function clearCookie(res) {
    res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`);
  }

  function isAdmin(req) {
    return verifyToken(readCookie(req));
  }

  function requireAdmin(req, res, next) {
    if (isAdmin(req)) return next();
    res.status(401).json({ error: 'Admin login required' });
  }

  return { issueToken, checkPassword, setCookie, clearCookie, isAdmin, requireAdmin };
}
