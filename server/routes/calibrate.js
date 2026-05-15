import express from 'express';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

const __dirname = dirname(fileURLToPath(import.meta.url));
const FINGERPRINTS_FILE = join(__dirname, '../data/fingerprints.json');

function readFingerprints() {
  if (!existsSync(FINGERPRINTS_FILE)) return {};
  return JSON.parse(readFileSync(FINGERPRINTS_FILE, 'utf8'));
}

function writeFingerprints(data) {
  writeFileSync(FINGERPRINTS_FILE, JSON.stringify(data, null, 2));
}

let pendingScan = null;

// POST /api/calibrate/pending - ESP32 posts raw WiFi scan, zone assigned later via web UI
router.post('/pending', (req, res) => {
  const apiKey = req.get('X-Api-Key');

  if (apiKey !== req.api_key) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { readings } = req.body;

  if (!readings || !Array.isArray(readings)) {
    return res.status(400).json({ error: 'Missing or invalid readings' });
  }

  pendingScan = {
    readings,
    scannedAt: new Date().toISOString(),
  };

  console.log(`📡 Pending scan received from ESP32 (${readings.length} APs)`);
  res.json({ success: true, ap_count: readings.length });
});

// GET /api/calibrate/pending - Web UI polls for latest ESP32 scan
router.get('/pending', (req, res) => {
  res.json(pendingScan || null);
});

// POST /api/calibrate/confirm - Web UI assigns a zone to the pending scan and saves it
router.post('/confirm', (req, res) => {
  const { zone } = req.body;

  if (!zone) {
    return res.status(400).json({ error: 'Missing zone' });
  }

  if (!pendingScan) {
    return res.status(404).json({ error: 'No pending scan to confirm' });
  }

  const fingerprint = {};
  pendingScan.readings.forEach((reading) => {
    if (reading.bssid && reading.rssi !== undefined) {
      fingerprint[reading.bssid] = reading.rssi;
    }
  });

  const fingerprints = readFingerprints();
  fingerprints[zone] = fingerprint;
  writeFingerprints(fingerprints);

  const savedAps = Object.keys(fingerprint).length;
  console.log(`✅ Fingerprint saved for zone: ${zone} (${savedAps} APs)`);

  pendingScan = null;
  res.json({ success: true, zone, ap_count: savedAps });
});

// GET /api/calibrate/fingerprints - Fetch all stored fingerprints
router.get('/fingerprints', (req, res) => {
  res.json(readFingerprints());
});

// DELETE /api/calibrate/fingerprints/:zone - Remove a zone's fingerprint
router.delete('/fingerprints/:zone', (req, res) => {
  const apiKey = req.get('X-Api-Key');

  if (apiKey !== req.api_key) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { zone } = req.params;
  const fingerprints = readFingerprints();
  const existed = zone in fingerprints;

  if (existed) {
    delete fingerprints[zone];
    writeFingerprints(fingerprints);
    console.log(`🗑️  Deleted fingerprint for zone: ${zone}`);
  }

  res.json({ success: true, deleted: existed });
});

export default router;
