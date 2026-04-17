import express from 'express';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCATION_FILE = join(__dirname, '../data/location.json');

function readLocation() {
  if (!existsSync(LOCATION_FILE)) {
    return { zone: 'unknown', timestamp: null, updatedAt: null };
  }
  return JSON.parse(readFileSync(LOCATION_FILE, 'utf8'));
}

function writeLocation(data) {
  writeFileSync(LOCATION_FILE, JSON.stringify(data, null, 2));
}

// POST /api/location - ESP32 or client sends location update
router.post('/', (req, res) => {
  const apiKey = req.get('X-Api-Key');

  if (apiKey !== req.api_key) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { zone, timestamp } = req.body;

  if (!zone) {
    return res.status(400).json({ error: 'Missing zone field' });
  }

  const location = {
    zone,
    timestamp: timestamp || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  writeLocation(location);
  console.log(`📍 Cart location updated: ${zone}`);
  res.json({ success: true, location });
});

// GET /api/location - Frontend or anyone can read current location
router.get('/', (req, res) => {
  res.json(readLocation());
});

export default router;
