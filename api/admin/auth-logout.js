import { requireSession, clearSessionCookie } from '../_lib/session.js';
import { requireCsrf } from '../_lib/csrf.js';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');
  const session = requireSession(req);
  if (!session) return res.redirect(303, '/admin');
  if (!requireCsrf(req, res)) return;
  console.log('[auth-logout] signed out:', session.email);
  res.setHeader('Set-Cookie', clearSessionCookie());
  return res.redirect(303, '/admin');
}
