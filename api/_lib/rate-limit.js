// In-memory LRU rate limiter — resets on cold start, adequate for ~4 trusted users
const WINDOW_MS = 10 * 60 * 1000; // 10 min
const MAX_HITS = 5;
const MAX_ENTRIES = 500;

const store = new Map();

function evict() {
  if (store.size < MAX_ENTRIES) return;
  const oldest = store.keys().next().value;
  store.delete(oldest);
}

export function checkRateLimit(ip) {
  const now = Date.now();
  const entry = store.get(ip) ?? { count: 0, reset: now + WINDOW_MS };
  if (now > entry.reset) {
    entry.count = 0;
    entry.reset = now + WINDOW_MS;
  }
  entry.count++;
  evict();
  store.set(ip, entry);
  return entry.count <= MAX_HITS;
}

export function getClientIp(req) {
  return (req.headers['x-forwarded-for'] ?? '').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
}
