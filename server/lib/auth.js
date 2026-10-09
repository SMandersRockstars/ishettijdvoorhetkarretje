import { timingSafeEqual, createHash } from 'crypto';

// Hash both sides so the buffers are always equal length (timingSafeEqual requires it
// and a length check alone would leak the key length).
const digest = (s) => createHash('sha256').update(String(s)).digest();

export function requireApiKey(req, res, next) {
  const provided = req.get('X-Api-Key') || '';
  if (!timingSafeEqual(digest(provided), digest(req.api_key))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}
