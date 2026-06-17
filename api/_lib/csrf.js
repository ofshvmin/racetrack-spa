const SITE = process.env.SITE_URL ?? 'https://chemungspeedrome.com';

export function requireCsrf(req, res) {
  const origin = req.headers['origin'] ?? '';
  const xrw = req.headers['x-requested-with'] ?? '';

  const allowed = [SITE, 'http://localhost:4321', 'http://localhost:3000'];
  if (!allowed.some(o => origin === o)) {
    res.status(403).json({ error: 'Bad origin' });
    return false;
  }
  if (xrw.toLowerCase() !== 'fetch') {
    res.status(403).json({ error: 'Missing X-Requested-With header' });
    return false;
  }
  return true;
}
