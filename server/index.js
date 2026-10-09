import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import locationRoutes from './routes/location.js';
import calibrateRoutes from './routes/calibrate.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Seed fingerprints from env var if file doesn't exist yet
const FINGERPRINTS_FILE = join(__dirname, 'data/fingerprints.json');
if (process.env.FINGERPRINTS_DATA && !existsSync(FINGERPRINTS_FILE)) {
  try {
    const data = Buffer.from(process.env.FINGERPRINTS_DATA, 'base64').toString('utf8');
    writeFileSync(FINGERPRINTS_FILE, data);
    console.log('📍 Fingerprints seeded from FINGERPRINTS_DATA env var');
  } catch (e) {
    console.error('Failed to seed fingerprints:', e.message);
  }
}

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  console.error('API_KEY env var is required');
  process.exit(1);
}

// Behind nginx: trust one proxy hop so rate limiting sees the real client IP
app.set('trust proxy', 1);

// Same-origin by default (frontend is served via nginx / Vite proxy).
// Set CORS_ORIGINS to a comma-separated list to allow other browser origins.
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '100kb' }));

// Throttle brute-forcing of the API key on state-changing requests
const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use((req, res, next) =>
  ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) ? writeLimiter(req, res, next) : next()
);

// Middleware to validate API key on protected routes
app.use((req, res, next) => {
  req.api_key = API_KEY;
  next();
});

// Routes
app.use('/api/location', locationRoutes);
app.use('/api/calibrate', calibrateRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handler: no stack traces to clients
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.status && err.status < 500 ? err.message : 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🛒 Karretje Tracker server running on port ${PORT}`);
});
