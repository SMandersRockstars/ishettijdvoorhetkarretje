import express from 'express';

const router = express.Router();

// In-memory store for fingerprints
// Structure: { zone_id: { bssid: rssi } }
let fingerprints = {};

// Latest pending scan from ESP32 (no zone yet)
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

  // Convert readings to BSSID -> RSSI map
  const fingerprint = {};
  pendingScan.readings.forEach((reading) => {
    if (reading.bssid && reading.rssi !== undefined) {
      fingerprint[reading.bssid] = reading.rssi;
    }
  });

  fingerprints[zone] = fingerprint;
  const savedAps = Object.keys(fingerprint).length;

  console.log(`✅ Fingerprint saved for zone: ${zone} (${savedAps} APs)`);

  // Clear the pending scan
  pendingScan = null;

  res.json({ success: true, zone, ap_count: savedAps });
});

// GET /api/calibrate/fingerprints - Fetch all stored fingerprints
router.get('/fingerprints', (req, res) => {
  res.json(fingerprints);
});

// DELETE /api/calibrate/fingerprints/:zone - Remove a zone's fingerprint
router.delete('/fingerprints/:zone', (req, res) => {
  const apiKey = req.get('X-Api-Key');

  if (apiKey !== req.api_key) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { zone } = req.params;
  const existed = zone in fingerprints;

  if (existed) {
    delete fingerprints[zone];
    console.log(`🗑️  Deleted fingerprint for zone: ${zone}`);
  }

  res.json({ success: true, deleted: existed });
});

export default router;
