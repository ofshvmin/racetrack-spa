import crypto from 'crypto';

// process.env works in Vercel Functions; import.meta.env works in Astro/Vite SSR dev
const SECRET = process.env.ADMIN_SESSION_SECRET ?? import.meta.env?.ADMIN_SESSION_SECRET ?? '';
const SESSION_DAYS = 7;
const LINK_MINUTES = 15;

function hmac(payload) {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
}

// ── Magic-link token ──────────────────────────────────────────────────────────

export function createMagicToken(email, nonce) {
  const expires = Date.now() + LINK_MINUTES * 60 * 1000;
  const payloadB64 = Buffer.from(JSON.stringify({ email, nonce, expires })).toString('base64url');
  return payloadB64 + '.' + hmac(payloadB64);
}

export function verifyMagicToken(token) {
  const dot = token.lastIndexOf('.');
  if (dot < 0) return null;
  const payloadB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expectedSig = hmac(payloadB64);
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;
  let parsed;
  try { parsed = JSON.parse(Buffer.from(payloadB64, 'base64url').toString()); } catch { return null; }
  if (Date.now() > parsed.expires) return null;
  return parsed;
}

// ── Session cookie ────────────────────────────────────────────────────────────

export function createSessionCookie(email) {
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payloadB64 = Buffer.from(JSON.stringify({ email, expires })).toString('base64url');
  const value = payloadB64 + '.' + hmac(payloadB64);
  return `admin-session=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_DAYS * 86400}`;
}

export function clearSessionCookie() {
  return 'admin-session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0';
}

export function parseCookies(req) {
  const raw = req.headers['cookie'] ?? '';
  return Object.fromEntries(raw.split(';').map(p => p.trim().split('=').map((v, i) => i === 1 ? decodeURIComponent(v) : v.trim())).filter(p => p[0]));
}

export function requireSession(req) {
  const cookies = parseCookies(req);
  const token = cookies['admin-session'];
  if (!token) return null;
  const dot = token.lastIndexOf('.');
  if (dot < 0) return null;
  const payloadB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expectedSig = hmac(payloadB64);
  if (sig.length !== expectedSig.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;
  let parsed;
  try { parsed = JSON.parse(Buffer.from(payloadB64, 'base64url').toString()); } catch { return null; }
  if (Date.now() > parsed.expires) return null;
  return parsed;
}

// ── Nonce cookie (browser-binding) ────────────────────────────────────────────

export function createNonceCookie(nonce) {
  // Lax (not Strict) so the cookie is sent when clicking the magic link from an email client
  return `pending-login-nonce=${nonce}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${LINK_MINUTES * 60}`;
}

export function clearNonceCookie() {
  return 'pending-login-nonce=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0';
}

// ── Allow-list ────────────────────────────────────────────────────────────────

export function isAllowed(email) {
  const list = (process.env.ADMIN_EMAILS ?? import.meta.env?.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  return list.includes(email.trim().toLowerCase());
}
