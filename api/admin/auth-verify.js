import { verifyMagicToken, createSessionCookie, clearNonceCookie, parseCookies } from '../_lib/session.js';

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end('Method Not Allowed');

  const token = req.query?.token ?? '';
  const parsed = verifyMagicToken(token);

  if (!parsed) {
    return res.redirect(303, '/admin?error=invalid-link');
  }

  // Verify the nonce matches the cookie set during auth-request (browser-binding)
  const cookies = parseCookies(req);
  const cookieNonce = cookies['pending-login-nonce'] ?? '';
  if (!cookieNonce || cookieNonce !== parsed.nonce) {
    return res.redirect(303, '/admin?error=invalid-link');
  }

  res.setHeader('Set-Cookie', [createSessionCookie(parsed.email), clearNonceCookie()]);
  return res.redirect(303, '/admin');
}
