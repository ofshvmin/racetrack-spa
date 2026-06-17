import { Resend } from 'resend';
import { createMagicToken, createNonceCookie, isAllowed } from '../_lib/session.js';
import { checkRateLimit, getClientIp } from '../_lib/rate-limit.js';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'onboarding@resend.dev';
const SITE = process.env.SITE_URL ?? 'https://chemungspeedrome.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a few minutes and try again.' });
  }

  const email = (req.body?.email ?? '').trim().toLowerCase();

  // Always respond the same way to avoid leaking the allow-list
  const ok = () => res.status(200).json({ ok: true });

  if (!email || !isAllowed(email)) return ok();

  const nonce = crypto.randomBytes(16).toString('hex');
  const token = createMagicToken(email, nonce);
  const link = `${SITE}/api/admin/auth-verify?token=${encodeURIComponent(token)}`;

  try {
    const result = await resend.emails.send({
      from: FROM,
      to: [email],
      subject: 'Sign in to Chemung Speedrome Admin',
      html: buildEmail(link),
    });
    console.log('[auth-request] magic link sent to', email, '— id:', result?.data?.id);
  } catch (err) {
    console.error('[auth-request] resend failed for', email, '—', err?.message ?? err);
  }

  res.setHeader('Set-Cookie', createNonceCookie(nonce));
  return ok();
}

function buildEmail(link) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f5;font-family:system-ui,sans-serif">
<div style="max-width:520px;margin:40px auto;background:#fff;border:1px solid #e0e0e0;border-radius:4px;overflow:hidden">
  <div style="background:#0a0a0c;padding:24px 32px;border-bottom:3px solid #e8552a">
    <p style="margin:0;color:#a3a09a;font-size:12px;letter-spacing:0.12em;text-transform:uppercase">Chemung Speedrome</p>
    <h1 style="margin:6px 0 0;color:#f5f3ef;font-size:22px;font-weight:700">Admin Sign-in</h1>
  </div>
  <div style="padding:32px">
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#333">
      Click the button below to sign in to the results admin. This link expires in 15 minutes and can only be used from the same browser that requested it.
    </p>
    <a href="${link}" style="display:inline-block;background:#e8552a;color:#fff;font-size:15px;font-weight:700;padding:14px 32px;border-radius:4px;text-decoration:none;letter-spacing:0.02em">Sign in to Admin →</a>
    <p style="margin:24px 0 0;font-size:12px;color:#aaa;line-height:1.6">
      If you didn't request this link, you can safely ignore this email.<br />
      Link expires: 15 minutes from now.
    </p>
  </div>
</div>
</body></html>`;
}
