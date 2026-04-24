# Release Checklist — Karretje Tracker

## 1. Prepare fingerprints for production

The calibration data needs to be bundled as an env var so the production server seeds it on first boot.

Run in WSL:
```bash
base64 -w 0 server/data/fingerprints.json
```

Copy the output — you'll need it in step 3.

---

## 2. Merge to main

```bash
git checkout karretje_tracker
git push origin karretje_tracker
# Open PR on GitHub: karretje_tracker → main
# Merge after CI passes
```

---

## 3. Set env vars on the production server

Whoever deploys the Docker image needs to set these environment variables:

| Variable | Value |
|---|---|
| `API_KEY` | Any secret string (keep it safe, ESP32 uses it too) |
| `FINGERPRINTS_DATA` | The base64 string from step 1 |

The server seeds `fingerprints.json` from `FINGERPRINTS_DATA` on first boot if the file doesn't exist yet.

---

## 4. Build and deploy the Docker image

```bash
docker build -t karretje-tracker .
```

The image runs both nginx (frontend on port 80) and the Node.js server (port 3001, proxied via nginx at `/api`).

Deploy with:
```bash
docker run -d \
  -p 80:80 \
  -e API_KEY=your-secret-key \
  -e FINGERPRINTS_DATA=<base64-from-step-1> \
  karretje-tracker
```

> If the deployment platform sets env vars differently (e.g. Kubernetes secrets, Coolify, Portainer), set them there instead of passing via `-e`.

---

## 5. Verify the deployed server

Once running, check:
```
https://your-domain.com/health          → {"status":"ok"}
https://your-domain.com/api/location    → {"zone":"unknown",...}
https://your-domain.com/waarishetkarretje  → map page loads
```

---

## 6. Reflash ESP32 with production URL

Update `esp32_cart_tracker/config.h`:
```cpp
#define SERVER_URL "https://your-domain.com"  // or http://ip:port
#define API_KEY "your-secret-key"             // same as env var on server
#define CALIBRATION_MODE 0
#define SLEEP_DURATION_FRIDAY 1800
#define SLEEP_DURATION_WEEKDAY 21600
```

Flash and verify in serial monitor:
- WiFi connected
- Time synced
- Fingerprints fetched: 5 zones
- Location posted successfully

---

## 7. Test end-to-end on a Friday

- Bring the ESP32 to the office on a Friday
- Watch serial output — should post location every 30 minutes
- Open `https://your-domain.com/waarishetkarretje` and verify the correct zone highlights
- Walk to a different zone, wait 30 min, confirm map updates

---

## 8. Done

The main site (`/`) only shows the cart map on Fridays (`isFriday()` check in the frontend). The `/waarishetkarretje` page always shows the map regardless of day — useful for testing.

---

## If you need to recalibrate in production

1. Make sure the production server is reachable from the office WiFi
2. Flash ESP32 with `CALIBRATION_MODE 1` and `SERVER_URL` pointing to production
3. Walk each zone, press BOOT button, assign in `/calibrate` web UI
4. After all zones are done, re-run step 1 to generate a new `FINGERPRINTS_DATA` value and update the env var on the server
5. Reflash ESP32 with `CALIBRATION_MODE 0`
