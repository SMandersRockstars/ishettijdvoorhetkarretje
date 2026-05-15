# ESP32 Cart Tracker Firmware

Arduino sketch for the ESP32 mounted on the cart. Determines its location via WiFi RSSI fingerprinting and POSTs it to the server on Fridays.

## Hardware

- ESP32 (any variant with WiFi + deep sleep)
- Micro USB cable for flashing
- USB power supply or battery pack for deployment

## Setup

### 1. Install Arduino IDE and libraries

1. Download [Arduino IDE 2.x](https://www.arduino.cc/en/software) or use Arduino Maker Workshop (VS Code extension)
2. Add ESP32 board support:
   - **File → Preferences → Additional Boards Manager URLs:**
     `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
   - **Tools → Board → Board Manager** → search "esp32" → install "esp32 by Espressif Systems"
3. Install library: **Sketch → Include Library → Manage Libraries** → search and install `ArduinoJson` by Benoit Blanchon (v7.0.0 or higher)

### 2. Configure `config.h`

`config.h` is gitignored (it contains credentials). Copy the example and fill in your values:

```bash
cp config.h.example config.h
```

Then edit `config.h`:

- **`WIFI_SSID` / `WIFI_PASSWORD`** — the office WiFi the ESP32 connects to
- **`SERVER_URL`** — LAN IP of the machine running the server (e.g. `http://192.168.x.x:3001`). On Windows run `ipconfig` and look for the Wi-Fi IPv4 address.
- **`API_KEY`** — must match the `API_KEY` env var set on the server
- **`CALIBRATION_MODE`** — set to `1` for calibration, `0` for normal tracking
- **`SLEEP_DURATION_FRIDAY`** — seconds between location updates on Fridays (default: `1800` = 30 min)

> **Note:** `SERVER_URL` must be reachable from the ESP32's network. If the server runs in WSL2 on Windows, you need a `netsh` portproxy rule — see below.

### 3. Flash

1. Select board: **Tools → Board → esp32 → ESP32 Dev Module**
2. Select port: **Tools → Port → COMx** (Windows) or `/dev/ttyUSB0` (WSL/Linux)
3. Click **Upload**

### 4. View serial output

**Windows** (PowerShell):
```powershell
python -m serial.tools.miniterm COM9 115200
```

**WSL2** (after attaching USB with usbipd — see `wsl-usb-setup.md`):
```bash
sudo chmod 666 /dev/ttyUSB0
screen /dev/ttyUSB0 115200
```
Exit screen with `Ctrl+A` then `K` then `Y`.

---

## Operation modes

### Normal mode (`CALIBRATION_MODE 0`)

1. Boot: connect WiFi → sync NTP time → fetch zone fingerprints from server
2. Check if today is Friday
   - Not Friday: sleep 6 hours, repeat
   - Friday: scan WiFi (3 averaged scans, APs below -85 dBm filtered), match against fingerprints, POST location, sleep 30 min

**Expected serial output:**
```
=== Cart Tracker Booting ===
Mode: NORMAL
Connecting to WiFi: YourWiFi
WiFi connected! IP: 192.168.x.x
Syncing time with NTP...
Time synced!
Fingerprints fetched: 5 zones
=== LOCATION TRACKING ===
Day=5 Time=14:30
Scanning WiFi (3x averaged)...
  stiltehoek: distance=8.2
  keuken: distance=22.4
  saleshoek: distance=31.1
  recruitmentblok: distance=41.7
  workcafe: distance=18.9
Best match: stiltehoek
Location posted!
Sleeping for 30 minutes...
```

### Calibration mode (`CALIBRATION_MODE 1`)

Used to build the zone fingerprint database. The ESP32 waits for a button press, scans WiFi, and sends raw readings to the server. You then assign the zone via the web UI.

**Steps:**
1. Set `CALIBRATION_MODE 1` in `config.h` and flash
2. Start the server and open `http://<server-ip>:5299/calibrate` in a browser
3. Walk to a zone, press the **BOOT button** on the ESP32
4. The scan appears in the web UI — select the zone and confirm
5. Repeat for all zones (currently: Stiltehoek, Keuken, Recruitmentblok, Saleshoek, Workcafé)
6. Set `CALIBRATION_MODE 0`, reflash for normal operation

---

## WSL2 portproxy (Windows)

The ESP32 connects to the server via your Windows WiFi IP. Since the server runs in WSL2, you need to forward the port. Run in **PowerShell as Administrator**:

```powershell
# Find your Windows WiFi IP first
ipconfig
# Look for "Wireless LAN adapter Wi-Fi" → IPv4 Address

# Forward port from Windows to WSL2
netsh interface portproxy add v4tov4 listenport=3001 listenaddress=0.0.0.0 connectport=3001 connectaddress=<WSL2-IP>

# Allow through firewall
netsh advfirewall firewall add rule name="WSL2 port 3001" dir=in action=allow protocol=TCP localport=3001
```

Find your WSL2 IP with `hostname -I` in WSL. Note: the portproxy resets when WSL restarts.

---

## Troubleshooting

**`POST failed: -1`** — ESP32 can't reach the server
- Check `SERVER_URL` matches your current Windows WiFi IP (`ipconfig`)
- Verify the portproxy rule is still active: `netsh interface portproxy show all`
- Test from another device: `http://<ip>:3001/health` should return `{"status":"ok"}`

**`No networks or fingerprints, sleeping...`** — fingerprints not loaded
- The server may have restarted and lost in-memory fingerprints
- Check: `curl http://localhost:3001/api/calibrate/fingerprints` — if empty, recalibrate

**`WiFi connection failed`** — wrong SSID/password or out of range

**`NTP sync failed`** — no internet access on that WiFi, or UDP port 123 blocked

**Permission denied on `/dev/ttyUSB0`** (WSL):
```bash
sudo chmod 666 /dev/ttyUSB0
# Permanent fix (needs re-login):
sudo usermod -aG dialout $USER
```

---

## Power

- Active (scanning + posting): ~100 mA for ~5 seconds per cycle
- Deep sleep: ~10 µA
- On a 2000 mAh battery at 30-min intervals (Fridays only): lasts months
