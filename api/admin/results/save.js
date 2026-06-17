import { requireSession } from '../../_lib/session.js';
import { requireCsrf } from '../../_lib/csrf.js';
import { validateResultsEntry, isValidRaceDate } from '../../_lib/schema-results.js';
import { upsertJsonArray, removeJsonArrayEntry } from '../../_lib/github.js';
import schedule from '../../../src/content/schedule.json' with { type: 'json' };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const session = requireSession(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });
  if (!requireCsrf(req, res)) return;

  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
  catch (err) {
    console.error('[save] invalid JSON from', session.email, '—', err?.message);
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  // Clear path: remove the night's results entirely.
  if (body?.clear === true) {
    if (!isValidRaceDate(body.date)) {
      console.warn('[save] clear rejected — invalid date', body?.date, 'by', session.email);
      return res.status(400).json({ error: 'Validation failed', errors: [{ field: 'date', message: 'Not a scheduled race date' }] });
    }
    const title = schedule.find(e => e.date === body.date && e.type === 'race')?.title ?? 'Race Night';
    const message = `Results: clear ${title} (${body.date}) — via admin (${session.email})`;
    try {
      const result = await removeJsonArrayEntry('src/content/results.json', 'date', body.date, message, session.email);
      if (result.conflict) {
        console.warn('[save] clear conflict on', body.date, 'for', session.email);
        return res.status(409).json({ error: 'Someone else just saved — please reload and try again.' });
      }
      if (!result.removed) {
        console.log('[save] clear no-op — no existing results for', body.date);
        return res.status(200).json({ removed: false });
      }
      console.log('[save] cleared', body.date, 'by', session.email, '— commit:', result.commitSha);
      return res.status(200).json({ commitSha: result.commitSha, commitUrl: result.commitUrl, removed: true });
    } catch (err) {
      console.error('[save] github clear error for', body.date, 'by', session.email, '—', err?.message ?? err);
      return res.status(500).json({ error: 'Failed to clear. Please try again.' });
    }
  }

  const validation = validateResultsEntry(body);
  if (!validation.ok) {
    console.warn('[save] validation failed for', body?.date, 'by', session.email, '—', JSON.stringify(validation.errors));
    return res.status(400).json({ error: 'Validation failed', errors: validation.errors });
  }

  const scheduleEntry = schedule.find(e => e.date === body.date && e.type === 'race');
  const entry = {
    date: body.date,
    title: body.title ?? scheduleEntry?.title ?? 'Race Night',
    raceNum: body.raceNum,
    divisions: body.divisions,
  };

  const message = `Results: ${entry.title} (${entry.date}) — via admin (${session.email})`;

  try {
    const result = await upsertJsonArray('src/content/results.json', 'date', entry, message, session.email);
    if (result.conflict) {
      console.warn('[save] conflict on', entry.date, 'for', session.email);
      return res.status(409).json({ error: 'Someone else just saved — please reload and try again.' });
    }
    console.log('[save] published', entry.date, 'by', session.email, '— commit:', result.commitSha);
    return res.status(200).json({ commitSha: result.commitSha, commitUrl: result.commitUrl });
  } catch (err) {
    console.error('[save] github error for', entry.date, 'by', session.email, '—', err?.message ?? err);
    return res.status(500).json({ error: 'Failed to save. Please try again.' });
  }
}
