import { verifyMagicToken, createSessionCookie, clearNonceCookie, parseCookies } from '../_lib/session.js';

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end('Method Not Allowed');

  const token = req.query?.token ?? '';
  const parsed = verifyMagicToken(token);

  if (!parsed) {
    console.warn('[auth-verify] invalid or expired token');
    return res.redirect(303, '/admin?error=invalid-link');
  }

  const cookies = parseCookies(req);
  const cookieNonce = cookies['pending-login-nonce'] ?? '';
  if (!cookieNonce || cookieNonce !== parsed.nonce) {
    console.warn('[auth-verify] nonce mismatch for', parsed.email, '— possible different browser or replay');
    return res.redirect(303, '/admin?error=invalid-link');
  }

  console.log('[auth-verify] signed in:', parsed.email);
  res.setHeader('Set-Cookie', [createSessionCookie(parsed.email), clearNonceCookie()]);
  return res.redirect(303, '/admin');
}
