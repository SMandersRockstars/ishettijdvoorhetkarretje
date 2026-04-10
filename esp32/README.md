# 🛒 ESP32 Cart Tracker Firmware

This directory contains the Arduino sketch for the ESP32 that runs on the cart and determines its location based on WiFi signal strength (RSSI) fingerprinting.

## Hardware Requirements

- ESP32 microcontroller (any variant with WiFi and deep sleep support)
- Micro USB cable for programming
- Micro USB power supply or battery pack for deployment

## Setup Instructions

### 1. Install Arduino IDE and Libraries

1. Download and install [Arduino IDE 2.x](https://www.arduino.cc/en/software)
2. Add ESP32 board support:
   - Go to **File → Preferences**
   - Add to "Additional Boards Manager URLs": `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
   - Go to **Tools → Board → Board Manager**
   - Search for "esp32" and install "esp32 by Espressif Systems"

3. Install required libraries:
   - **Sketch → Include Library → Manage Libraries**
   - Search and install:
     - `ArduinoJson` (by Benoit Blanchon) - v7.0.0 or higher
     - `HTTPClient` (built-in with ESP32 board support)

### 2. Configure the Sketch

1. Open `config.h` and update:
   ```cpp
   #define WIFI_SSID "YOUR_WIFI_SSID"
   #define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"
   #define SERVER_URL "http://192.168.1.100:3001"  // Your server IP/domain + port
   #define API_KEY "dev-key-change-in-production"   // Match backend API_KEY
   ```

2. Set the board:
   - **Tools → Board → esp32 → ESP32 Dev Module** (or your specific board)
   - **Tools → Upload Speed → 115200**
   - **Tools → Port → /dev/ttyUSB0** (or your COM port)

### 3. Flash the Firmware

1. Open `cart_tracker.ino` in Arduino IDE
2. Click **Upload** (→ button) or **Sketch → Upload**
3. Open **Tools → Serial Monitor** (115200 baud) to view debug output

## Operation Modes

### Normal Mode (CALIBRATION_MODE = 0)

**What it does:**
1. On boot: connects to WiFi, syncs time via NTP, fetches fingerprints from server
2. Every ~30 minutes (if Friday): scans WiFi networks, compares against stored fingerprints, POSTs location to `/api/location`
3. On other days: sleeps for 6 hours between cycles

**Expected output:**
```
[0.50s] 📡 Connecting to WiFi: MyWiFi
[1.20s] ✅ WiFi connected!
[2.00s] 🕐 Syncing time with NTP...
[3.50s] ✅ Time synced: Fri Apr 11 10:30:00 2026
[3.60s] ✅ Fingerprints fetched!
[3.61s]    Found 3 zones
[5.00s] 📍 === LOCATION TRACKING MODE ===
[5.10s] Current: Day=5 Time=10:30
[5.20s] 🔍 Scanning WiFi networks...
[6.00s] Found 5 networks:
[6.10s]   [0] Office (AA:BB:CC:DD:EE:01) RSSI: -45
[6.20s]   [1] Guest (AA:BB:CC:DD:EE:02) RSSI: -72
[6.30s]   kitchen: distance=15.3 (APs: 2)
[6.35s]   dev_room: distance=8.7 (APs: 3)
[6.40s]   meeting_room: distance=42.1 (APs: 1)
[6.50s] ✅ Best match: dev_room (distance: 8.7)
[6.60s] 📤 POSTing location to http://192.168.1.100:3001/api/location
[7.00s] ✅ Location posted! Response: 200
[7.10s] 💤 Deep sleep for 1800 seconds (30 minutes)...
```

### Calibration Mode (CALIBRATION_MODE = 1)

**What it does:**
1. On boot: connects to WiFi, syncs time
2. Scans WiFi networks and POSTs the readings to `/api/calibrate/scan`
3. Sleeps and repeats

**To use calibration mode:**
1. Set `#define CALIBRATION_MODE 1` in `config.h`
2. Upload the firmware
3. Move the ESP32 to the first zone you want to calibrate
4. Open the calibration tool at `http://localhost:6969/calibrate` in a web browser
5. Select the zone from the dropdown
6. The ESP32 will automatically scan and POST its readings
7. Confirm the scan looks good, then move to the next zone
8. Repeat for all zones

Once all zones are calibrated:
1. Set `#define CALIBRATION_MODE 0` back to normal mode
2. Upload the firmware
3. The ESP32 will now track location on Fridays

## Troubleshooting

### ❌ WiFi Not Connecting

- Check SSID and password are correct (case-sensitive!)
- Ensure the ESP32 is in range of the WiFi network
- Try a 5GHz network if available (some ESP32s prefer 2.4GHz)

### ❌ NTP Sync Failed

- Check the ESP32 has internet access after WiFi connects
- Try a different NTP server in `config.h`
- Check if a firewall is blocking UDP port 123

### ❌ Can't Reach the Server

- Ensure `SERVER_URL` is reachable from the ESP32's network
- Try pinging the server from another device on the same network
- Check firewall/router rules for the port (default: 3001)
- Make sure the backend server is running (`npm start` in `server/`)

### ❌ API Key Rejection (401 Unauthorized)

- Ensure `API_KEY` in `config.h` matches the `API_KEY` env var in the backend
- Check that `X-Api-Key` header is being sent (firmware does this automatically)

## Deep Sleep Behavior

- **Friday:** Wakes every 30 minutes to check/post location
- **Other days:** Wakes every 6 hours (to save battery)
- On wake: takes ~2 seconds to connect WiFi, sync time, and post location

To test without waiting, temporarily reduce:
```cpp
#define SLEEP_DURATION_FRIDAY 30     // 30 seconds instead of 1800
#define SLEEP_DURATION_WEEKDAY 60    // 60 seconds instead of 21600
```

## Power Considerations

- **Active scanning/posting:** ~100 mA (2-3 seconds)
- **Deep sleep:** ~10 mA (with WiFi radio off)
- **Expected life:** 1-2 weeks on a 2000 mAh battery with current settings

For longer life:
- Reduce scan frequency (increase sleep duration)
- Use a larger battery
- Move ESP32 to always-powered location (e.g., near power outlet)

## Files

- `cart_tracker.ino` - Main firmware sketch
- `config.h` - Configuration (WiFi, server, etc.)
- `README.md` - This file

## Testing Checklist

- [ ] Board recognized in Arduino IDE
- [ ] Sketch compiles without errors
- [ ] Firmware uploads successfully
- [ ] Serial output shows WiFi connection
- [ ] Serial output shows NTP time sync
- [ ] Fingerprints fetched from server
- [ ] Location POST successful (HTTP 200)
- [ ] Deep sleep triggers
