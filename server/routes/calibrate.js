import express from 'express';

const router = express.Router();

// In-memory store for fingerprints
// Structure: { zone_id: { bssid: rssi } }
let fingerprints = {};

// POST /api/calibrate/scan - ESP32 in calibration mode sends WiFi scan results
router.post('/scan', (req, res) => {
  const apiKey = req.get('X-Api-Key');

  // Validate API key
  if (apiKey !== req.api_key) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { zone, readings } = req.body;

  // Basic validation
  if (!zone || !readings || !Array.isArray(readings)) {
    return res.status(400).json({ error: 'Missing or invalid zone/readings' });
  }

  // Convert readings array to BSSID -> RSSI map
  const fingerprint = {};
  readings.forEach((reading) => {
    if (reading.bssid && reading.rssi !== undefined) {
      fingerprint[reading.bssid] = reading.rssi;
    }
  });

  // Store fingerprint for this zone
  fingerprints[zone] = fingerprint;

  console.log(`🔍 Fingerprint captured for zone: ${zone} (${readings.length} APs)`);
  res.json({
    success: true,
    zone,
    ap_count: readings.length,
  });
});

// GET /api/calibrate/fingerprints - Fetch all stored fingerprints
router.get('/fingerprints', (req, res) => {
  res.json(fingerprints);
});

// DELETE /api/calibrate/fingerprints/:zone - Remove a zone's fingerprint
router.delete('/fingerprints/:zone', (req, res) => {
  const apiKey = req.get('X-Api-Key');

  // Validate API key
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
