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

  if (!cookieNonce) {
    console.warn('[auth-verify] nonce cookie absent for', parsed.email, '— cookies present:', Object.keys(cookies));
    return res.redirect(303, '/admin?error=invalid-link');
  }

  if (cookieNonce !== parsed.nonce) {
    console.warn('[auth-verify] nonce value mismatch for', parsed.email,
      '— cookie ends:', cookieNonce.slice(-6), 'token ends:', parsed.nonce.slice(-6));
    return res.redirect(303, '/admin?error=invalid-link');
  }

  console.log('[auth-verify] signed in:', parsed.email);
  res.setHeader('Set-Cookie', [createSessionCookie(parsed.email), clearNonceCookie()]);
  return res.redirect(303, '/admin');
}
