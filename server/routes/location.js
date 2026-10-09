import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { requireApiKey } from '../lib/auth.js';
import { readJson, writeJsonAtomic } from '../lib/storage.js';

const router = express.Router();

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCATION_FILE = join(__dirname, '../data/location.json');

function readLocation() {
  return readJson(LOCATION_FILE, { zone: 'unknown', timestamp: null, updatedAt: null });
}

function writeLocation(data) {
  writeJsonAtomic(LOCATION_FILE, data);
}

// POST /api/location - ESP32 or client sends location update
router.post('/', requireApiKey, (req, res) => {
  const { zone, timestamp } = req.body;

  if (!zone || typeof zone !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid zone field (must be a string)' });
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
