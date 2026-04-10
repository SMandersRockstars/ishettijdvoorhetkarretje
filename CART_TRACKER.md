# 🛒 Karretje Tracker System

A complete system for tracking the office cart's location on Fridays using WiFi signal strength (RSSI) fingerprinting. Privacy-first: shows the cart in abstract zones only, not precise coordinates.

## System Overview

The system has three main components:

### 1. **Backend Server** (`server/`)
Express.js API that:
- Receives location updates from the ESP32 (Fridays only)
- Stores and serves current cart location to the frontend
- Manages WiFi fingerprint calibration data

**Key endpoints:**
- `POST /api/location` - ESP32 sends cart location
- `GET /api/location` - Frontend fetches current location
- `POST /api/calibrate/scan` - ESP32 sends WiFi scan results during calibration
- `GET /api/calibrate/fingerprints` - Fetch stored fingerprints

### 2. **Frontend UI** (`src/`)
React app showing:
- **Main page:** Cart status (is it Friday?) with optional map
- **Cart Map:** SVG visualization of office zones with cart location (Fridays only)
- **Calibration Tool:** Web UI to set up WiFi fingerprints (`/calibrate` path)

### 3. **ESP32 Hardware** (`esp32/`)
Microcontroller on the physical cart that:
- Scans WiFi networks and reads signal strength (RSSI)
- Matches scan against stored fingerprints to determine zone
- Only on Fridays: posts location to the backend
- Sleeps 30 minutes (Friday) or 6 hours (other days) between scans

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    User's Browser                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ React App (localhost:5173 or :6969 via docker)       │   │
│  │ • Main page: YES/NO + countdown                       │   │
│  │ • CartMap: Shows zone + 🛒 (Fridays only)            │   │
│  │ • Polls /api/location every 60s                       │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────┬────────────────────────────────────────────────┘
             │ HTTP/REST
             ↓
┌─────────────────────────────────────────────────────────────┐
│           nginx (reverse proxy + SPA serving)                │
│ Listens on :80 → routes /api to backend                     │
└────────────┬────────────────────────────────────────────────┘
             │
             ├─→ localhost:3001 (Node.js Express backend)
             │   • Stores latest location in memory
             │   • Manages fingerprint calibrations
             │
             └─→ Static files from dist/
│
│ (On docker: ports exposed via docker-compose)
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────┐
│    ESP32 on Cart (WiFi module)      │
│                                     │
│ 1. Scan WiFi networks (RSSI)        │
│ 2. Match against fingerprints       │
│ 3. POST location if Friday          │
│ 4. Deep sleep 30min (Fri) or 6h     │
│                                     │
│ Runs every cycle autonomously       │
│ No internet needed except Fridays   │
└────────────────────────────────────┘
```

## Setup & Deployment

### Local Development

**Backend:**
```bash
cd server
npm install
npm run dev
# Listens on http://localhost:3001
```

**Frontend:**
```bash
npm install
npm run dev
# Listens on http://localhost:5173
```

Both must be running. Frontend will proxy API calls to backend via its dev server config (if configured) or you access them separately.

### Docker Deployment (Production)

```bash
docker-compose up --build
# Frontend available at http://localhost:6969
# Backend runs at port 3001 (internal)
# API calls proxied via nginx
```

**Environment variables:**
```bash
API_KEY=your-secret-api-key-here docker-compose up
```

### ESP32 Setup

See `esp32/README.md` for detailed instructions.

**Quick start:**
1. Update `esp32/config.h` with WiFi and server details
2. Flash `esp32/cart_tracker.ino` using Arduino IDE
3. Run calibration to map WiFi fingerprints to zones
4. Set `CALIBRATION_MODE 0` and reflash for normal operation

## Calibration Workflow

### Step 1: Prepare calibration data

1. Open web UI at `http://localhost:6969/calibrate` (or dev server)
2. Set ESP32 to `CALIBRATION_MODE 1` in `esp32/config.h`
3. Flash ESP32

### Step 2: Walk around office

For each zone (e.g., "Keuken", "Dev Room", "Vergaderzaal"):

1. Go to that zone with ESP32 device
2. Press button on ESP32 (or it auto-scans)
3. ESP32 scans WiFi networks and POSTs readings to `/api/calibrate/scan`
4. Web UI receives the scan results
5. Confirm readings look good
6. Move to next zone

### Step 3: Finalize

1. Check all zones have calibration data
2. Set `CALIBRATION_MODE 0` in `config.h`
3. Re-flash ESP32
4. ESP32 will now fetch fingerprints and use them for location matching

### How matching works

When the ESP32 scans:
```
Live scan: {
  AA:BB:CC:DD:EE:01: -45 (Office AP),
  AA:BB:CC:DD:EE:02: -72 (Guest AP),
  AA:BB:CC:DD:EE:03: -88 (Backup AP)
}

Stored fingerprints:
  kitchen: {
    AA:BB:CC:DD:EE:01: -40,
    AA:BB:CC:DD:EE:02: -75
  }
  dev_room: {
    AA:BB:CC:DD:EE:01: -48,
    AA:BB:CC:DD:EE:02: -68,
    AA:BB:CC:DD:EE:03: -85
  }

Calculate Euclidean distance for each:
  kitchen: sqrt((-45-(-40))^2 + (-72-(-75))^2) / 2 = 3.5 ✓ BEST
  dev_room: sqrt((-45-(-48))^2 + (-72-(-68))^2 + (-88-(-85))^2) / 3 = 2.2
```

Best match = smallest distance = most likely zone.

## Zones Configuration

Zones are defined in `src/config.json`:

```json
{
  "zones": [
    { "id": "kitchen", "label": "Keuken", "x": 0, "y": 0, "w": 40, "h": 50 },
    { "id": "dev_room", "label": "Dev Kamer", "x": 40, "y": 0, "w": 60, "h": 50 },
    { "id": "meeting_room", "label": "Vergaderzaal", "x": 0, "y": 50, "w": 100, "h": 50 }
  ]
}
```

- `id`: unique zone identifier (used in API calls)
- `label`: human-readable name (shown on UI)
- `x, y, w, h`: SVG coordinates (% of viewport)

## API Reference

### Location Endpoints

**POST /api/location**
```bash
curl -X POST http://localhost:3001/api/location \
  -H "X-Api-Key: dev-key-change-in-production" \
  -H "Content-Type: application/json" \
  -d '{"zone":"kitchen","timestamp":"2026-04-11T10:30:00Z"}'

# Response: 200 OK
{
  "success": true,
  "location": {
    "zone": "kitchen",
    "timestamp": "2026-04-11T10:30:00Z",
    "updatedAt": "2026-04-10T11:48:22.243Z"
  }
}
```

**GET /api/location**
```bash
curl http://localhost:3001/api/location

# Response: 200 OK
{
  "zone": "kitchen",
  "timestamp": "2026-04-11T10:30:00Z",
  "updatedAt": "2026-04-10T11:48:22.243Z"
}
```

### Calibration Endpoints

**POST /api/calibrate/scan**
```bash
curl -X POST http://localhost:3001/api/calibrate/scan \
  -H "X-Api-Key: dev-key-change-in-production" \
  -H "Content-Type: application/json" \
  -d '{
    "zone": "kitchen",
    "readings": [
      {"bssid": "AA:BB:CC:DD:EE:01", "ssid": "Office", "rssi": -45},
      {"bssid": "AA:BB:CC:DD:EE:02", "ssid": "Guest", "rssi": -72}
    ]
  }'

# Response: 200 OK
{
  "success": true,
  "zone": "kitchen",
  "ap_count": 2
}
```

**GET /api/calibrate/fingerprints**
```bash
curl http://localhost:3001/api/calibrate/fingerprints

# Response: 200 OK
{
  "kitchen": {
    "AA:BB:CC:DD:EE:01": -45,
    "AA:BB:CC:DD:EE:02": -72
  },
  "dev_room": {
    "AA:BB:CC:DD:EE:01": -42,
    "AA:BB:CC:DD:EE:02": -68
  }
}
```

**DELETE /api/calibrate/fingerprints/:zone**
```bash
curl -X DELETE http://localhost:3001/api/calibrate/fingerprints/kitchen \
  -H "X-Api-Key: dev-key-change-in-production"

# Response: 200 OK
{
  "success": true,
  "deleted": true
}
```

## Friday-Only Behavior

The system is designed to only show and update location on Fridays:

- **Frontend:** `CartMap` component only renders on Fridays (checked via `isFriday()`)
- **ESP32:** Only POSTs location on Friday after boot, then sleeps for 30 minutes
- **Other days:** ESP32 sleeps for 6 hours to save battery

This is intentional for privacy — the cart's location is only tracked during the Friday party event ("het uur van de vrijmibo").

To test on other days:
1. Set your system clock to a Friday
2. Or modify `esp32/config.h` SLEEP_DURATION values for testing

## Troubleshooting

### Cart location not updating

1. Check ESP32 is powered on (LED should blink)
2. Check WiFi connection in serial monitor output
3. Verify API_KEY in `config.h` matches backend
4. Check server is running: `curl http://localhost:3001/health`
5. Look for POST errors in server logs

### Calibration data not showing up

1. Ensure ESP32 is in `CALIBRATION_MODE 1`
2. Check backend is receiving POSTs: `curl http://localhost:3001/api/calibrate/fingerprints`
3. Verify ESP32 can reach server (check URL in config.h)

### Map shows wrong zone

1. Recalibrate by deleting zone fingerprints and re-scanning
2. Move ESP32 to each zone and ensure strong WiFi signal
3. Check if new APs were added to the office (they'll throw off matching)

### Deep sleep not working

1. Ensure you're using a chip that supports deep sleep (most ESP32s do)
2. Check `SLEEP_DURATION_*` values are > 0
3. Verify power supply is stable (sleep draws less current)

## Security Notes

- **API Key:** Change `API_KEY` in `config.h` and backend (env var)
- **WiFi credentials:** Stored in `config.h` (not in code repo — use env vars or secrets)
- **No HTTPS in dev:** Use HTTPS in production (enable via nginx/reverse proxy)
- **Public location data:** Frontend serves location without auth (intentional for office visibility)
- **Fingerprints:** Also public (no sensitive data, just RSSI values)

## Performance & Battery Life

- **WiFi scan:** 1-2 seconds
- **Location POST:** 1-2 seconds
- **Active power:** ~100 mA
- **Deep sleep:** ~10 mA (WiFi radio off)

With current settings (30 min Friday, 6h weekday):
- **2000 mAh battery:** ~1-2 weeks
- **Powered externally:** Indefinite

## Files & Directory Structure

```
.
├── server/
│   ├── index.js                   # Express app entry
│   ├── package.json               # Node deps
│   ├── routes/
│   │   ├── location.js            # Location API
│   │   └── calibrate.js           # Calibration API
│   └── data/
│       └── .gitkeep               # Fingerprint data storage
├── esp32/
│   ├── cart_tracker.ino           # Main firmware
│   ├── config.h                   # Configuration template
│   └── README.md                  # Setup & troubleshooting
├── src/
│   ├── components/
│   │   ├── CartMap.jsx            # SVG office map
│   │   └── CalibrationTool.jsx    # Calibration UI
│   ├── contexts/
│   │   └── CartLocationContext.jsx # Location polling
│   ├── config.json                # Zone definitions
│   └── styles/
│       ├── cart-map.css
│       └── calibration-tool.css
├── docker-compose.yaml            # Docker setup
├── server.dockerfile              # Node.js container
├── nginx.conf                     # Reverse proxy config
└── CART_TRACKER.md               # This file
```

## Future Improvements

- **Persistent storage:** Replace in-memory location with database
- **Historical tracking:** Store past locations for analytics
- **Multi-ESP32 support:** Track multiple carts
- **Real floor plan:** Upload custom office layout image
- **Geofencing:** Trigger alerts when cart leaves/enters zones
- **Mobile app:** Native mobile client for cart tracking
- **HTTPS:** Enable encrypted communication
- **Authentication:** Add admin login for calibration tool

## Contributing

1. Follow the existing code style
2. Test on actual hardware before committing
3. Update documentation if changing APIs
4. Keep the system focused on Friday-only tracking (privacy-first)

## License

Same as the main project

## Questions?

See `esp32/README.md` for ESP32-specific questions, or check the main project README.
