import express from 'express';
import cors from 'cors';
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
const API_KEY = process.env.API_KEY || 'dev-key-change-in-production';

app.use(cors());
app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`🛒 Karretje Tracker server running on port ${PORT}`);
});
