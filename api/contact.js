import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const TO   = ['daniel.g.mathews@gmail.com'];
const FROM = process.env.RESEND_FROM_EMAIL ?? 'Chemung Speedrome <noreply@chemungspeedrome.com>';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const { name, email, subject, message, _gotcha } = req.body ?? {};

  // Honeypot: bots fill this field, humans don't see it
  if (_gotcha) {
    return res.redirect(303, '/contact?sent=true');
  }

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.redirect(303, '/contact?error=missing');
  }

  try {
    const { error: sendError } = await resend.emails.send({
      from: FROM,
      to: TO,
      replyTo: `${name.trim()} <${email.trim()}>`,
      subject: `[Speedrome Contact] ${subject || 'General Inquiry'} — ${name.trim()}`,
      html: buildHtml({ name, email, subject, message }),
    });
    if (sendError) throw sendError;
    return res.redirect(303, '/contact?sent=true');
  } catch (err) {
    console.error('Resend error:', err);
    return res.redirect(303, '/contact?error=send');
  }
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildHtml({ name, email, subject, message }) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f5;font-family:system-ui,sans-serif">
<div style="max-width:600px;margin:40px auto;background:#fff;border:1px solid #e0e0e0;border-radius:4px;overflow:hidden">
  <div style="background:#0a0a0c;padding:24px 32px;border-bottom:3px solid #e8552a">
    <p style="margin:0;color:#a3a09a;font-size:12px;letter-spacing:0.12em;text-transform:uppercase">Chemung Speedrome</p>
    <h1 style="margin:6px 0 0;color:#f5f3ef;font-size:22px;font-weight:700">Contact Form</h1>
  </div>
  <div style="padding:32px">
    <table style="width:100%;border-collapse:collapse">
      <tr>
        <td style="padding:10px 0;color:#666;font-size:13px;width:90px;vertical-align:top;border-bottom:1px solid #eee">Name</td>
        <td style="padding:10px 0;font-size:15px;font-weight:600;border-bottom:1px solid #eee">${esc(name)}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#666;font-size:13px;vertical-align:top;border-bottom:1px solid #eee">Email</td>
        <td style="padding:10px 0;font-size:15px;border-bottom:1px solid #eee"><a href="mailto:${esc(email)}" style="color:#e8552a">${esc(email)}</a></td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#666;font-size:13px;vertical-align:top">Subject</td>
        <td style="padding:10px 0;font-size:15px">${esc(subject || 'General Inquiry')}</td>
      </tr>
    </table>
    <div style="margin-top:24px;padding:20px;background:#f9f9f9;border-left:3px solid #e8552a">
      <p style="margin:0 0 10px;color:#999;font-size:11px;letter-spacing:0.1em;text-transform:uppercase">Message</p>
      <p style="margin:0;font-size:15px;line-height:1.65;white-space:pre-wrap">${esc(message)}</p>
    </div>
    <p style="margin:28px 0 0;color:#aaa;font-size:12px">
      Reply directly to this email to respond to ${esc(name)}.
    </p>
  </div>
</div>
</body></html>`;
}
