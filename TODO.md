# Karretje Tracker — TODO

## Where we left off
ESP32 is flashed in normal mode, calibration done for all 5 zones, accuracy improved (3x averaged scans, weak AP filtering). Server persists location + fingerprints to file.

---

## Next steps

### 1. Production deploy
- [ ] Get the production server URL from whoever deploys the Docker image
- [ ] Set these env vars on the production server:
  - `API_KEY` — any secret string you choose
  - `FINGERPRINTS_DATA` — base64 encoded fingerprints (run `base64 -w 0 server/data/fingerprints.json` to generate)
- [ ] Build and deploy the Docker image from the `karretje_tracker` branch (or merge to main first)

### 2. Reflash ESP32 with production URL
- [ ] Update `SERVER_URL` in `esp32/config.h` to the real deployed server URL
- [ ] Keep `CALIBRATION_MODE 0`
- [ ] Set `SLEEP_DURATION_FRIDAY` back to `1800` (30 min) once done testing
- [ ] Reflash

### 3. Merge to main
- [ ] Open PR from `karretje_tracker` → `main`
- [ ] Merge after confirming Docker build passes in CI

### 4. Accuracy tuning (if needed)
- [ ] If certain zones are still misidentified, recalibrate those zones
  - Flash with `CALIBRATION_MODE 1`, walk to the zone, press BOOT button, assign in `/calibrate` web UI
  - The averaged scan firmware is already in place, so new calibrations will be single-snapshot — consider taking 2-3 confirmations and using the last one
- [ ] Consider recalibrating all zones using the improved averaged scan firmware for better baseline quality

### 5. Nice-to-have (optional)
- [ ] Add "last seen X minutes ago" staleness indicator on the map if location is old
- [ ] Make the `/waarishetkarretje` page auto-refresh without polling (SSE or WebSocket)
- [ ] WSL2 portproxy resets on restart — set up a Windows startup script to re-run the netsh commands automatically
