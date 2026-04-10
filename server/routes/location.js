import express from 'express';

const router = express.Router();

// In-memory store for current location
let currentLocation = {
  zone: 'unknown',
  timestamp: null,
  updatedAt: null,
};

// POST /api/location - ESP32 or client sends location update
router.post('/', (req, res) => {
  const apiKey = req.get('X-Api-Key');

  // Validate API key
  if (apiKey !== req.api_key) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { zone, timestamp } = req.body;

  // Basic validation
  if (!zone) {
    return res.status(400).json({ error: 'Missing zone field' });
  }

  // Update location
  currentLocation = {
    zone,
    timestamp: timestamp || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  console.log(`📍 Cart location updated: ${zone}`);
  res.json({ success: true, location: currentLocation });
});

// GET /api/location - Frontend or anyone can read current location
router.get('/', (req, res) => {
  res.json(currentLocation);
});

export default router;
