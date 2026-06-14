import { requireSession, clearSessionCookie } from '../_lib/session.js';
import { requireCsrf } from '../_lib/csrf.js';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');
  if (!requireSession(req)) return res.redirect(303, '/admin');
  if (!requireCsrf(req, res)) return;
  res.setHeader('Set-Cookie', clearSessionCookie());
  return res.redirect(303, '/admin');
}
