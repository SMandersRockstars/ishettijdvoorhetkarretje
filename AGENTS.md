# AGENTS.md — ishettijdvoorhetkarretje

## What this is

A React SPA + Express API + ESP32 firmware project that tracks "karretje" (cart) time and location. The frontend shows whether it's "party time" (default: Friday 16:00). On Fridays, a CartMap component appears, showing the physical cart's location via WiFi fingerprinting from an ESP32 device.

## Dev commands

```bash
# Frontend dev server (Vite, port 5173, proxies /api → localhost:3001)
npm run dev

# Backend API server (Express, port 3001)
cd server && npm install && npm run dev   # --watch for hot reload

# Build for production
npm run build   # outputs to dist/

# Docker (frontend + backend + nginx on port 6969)
docker compose up --build
```

There is **no lint, test, or typecheck** configured. CI only validates `src/config.json` schema and builds the Docker image.

## Architecture

| Layer | Tech | Notes |
|-------|------|-------|
| Frontend | React 18 + Vite | Entry: `src/main.jsx` → `App.jsx`. No routing library — `App.jsx` checks `window.location.pathname` for `/waarishetkarretje` to render the standalone cart map. |
| Backend | Express (ESM) | `server/index.js`, port 3001. Two route modules: `routes/location.js` (cart position) and `routes/calibrate.js` (WiFi fingerprint management). All state is JSON files in `server/data/`. |
| ESP32 firmware | Arduino/C++ | `esp32_cart_tracker/esp32_cart_tracker.ino`. Connects to office WiFi, scans APs, matches fingerprints, POSTs zone to `/api/location`. Only active on Fridays. |
| Production | nginx + supervisord + node | Dockerfile builds frontend, installs backend deps, copies dist to nginx html, runs both via supervisord. Single port 80. |

### Key frontend contexts

- `src/contexts/ThemeContext.jsx` — theme switching (including seasonal: wintersport, christmas)
- `src/contexts/TimeContext.jsx` — party time logic, reads `src/config.json`
- `src/contexts/CartLocationContext.jsx` — polls `/api/location`, drives CartMap

### Config

- `src/config.json` — party time overrides + map zones. CI validates schema on every push/PR.
- `esp32_cart_tracker/config.h` — gitignored, contains WiFi credentials and server URL. Copy from `config.h.example`.

### Vite proxy

`vite.config.js` proxies `/api` → `http://localhost:3001`. During `npm run dev`, the frontend reaches the backend transparently.

## Deployment

Push to `main` triggers two workflows:
1. `docker-image.yml` — validates config.json, builds Docker image (no push)
2. `docker-publish.yml` — builds and pushes to `ghcr.io/smandersrockstars/ishettijdvoorhetkarretje-web` with `latest` + commit-based tags

## Data persistence

- `server/data/location.json` — current cart location (written by ESP32, read by frontend)
- `server/data/fingerprints.json` — WiFi AP fingerprints per zone (built via calibration flow)
- Both are gitignored. In Docker, `server/data` is mounted as a volume.
- `FINGERPRINTS_DATA` env var (base64) can seed fingerprints.json at server startup if file doesn't exist.

## ESP32 calibration flow

1. Set `CALIBRATION_MODE 1` in `config.h`, flash ESP32
2. Open calibration UI in browser, press BOOT button on ESP32 at each zone
3. Server stores pending scan at `/api/calibrate/pending`
4. Web UI assigns zone via `/api/calibrate/confirm`
5. Set `CALIBRATION_MODE 0`, reflash for normal operation

See `esp32_cart_tracker/README.md` for detailed instructions.
