// Cloudflare Turnstile server-side verification.
// Confirms the "Verify you are human" token the widget attaches to the form.
const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Verify a Turnstile token.
 * Fails closed when a secret is configured but the token is missing/invalid.
 * If TURNSTILE_SECRET_KEY is unset, logs a warning and allows the request
 * through so the form never hard-breaks before setup is finished.
 *
 * @param {string} token  the `cf-turnstile-response` value from the form
 * @param {string} [ip]   client IP, passed to Cloudflare as remoteip
 * @returns {Promise<boolean>} true if human-verified (or not yet configured)
 */
export async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.warn('[turnstile] TURNSTILE_SECRET_KEY not set — skipping verification');
    return true;
  }

  if (!token) return false;

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip && ip !== 'unknown') body.set('remoteip', ip);

    const resp = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const data = await resp.json();
    if (!data.success) {
      console.warn('[turnstile] verification failed —', (data['error-codes'] ?? []).join(', '));
    }
    return data.success === true;
  } catch (err) {
    console.error('[turnstile] verify request errored —', err?.message ?? err);
    // Network blip on Cloudflare's side: fail closed rather than wave bots through.
    return false;
  }
}
