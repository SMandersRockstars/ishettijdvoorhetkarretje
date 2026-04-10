// Configuration for ESP32 Cart Tracker
// IMPORTANT: Update these values for your environment

#ifndef CONFIG_H
#define CONFIG_H

// WiFi credentials
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Server settings
#define SERVER_URL "http://192.168.1.100:3001" // Change to your server IP/domain
#define API_KEY "dev-key-change-in-production"  // Match your backend API_KEY env var

// NTP server for time synchronization
#define NTP_SERVER "pool.ntp.org"

// Button pin for triggering scans (GPIO 0 = BOOT button)
#define BUTTON_PIN 0

// Calibration mode flag
// Set to 1 to enable calibration mode (scan and POST to /api/calibrate/scan)
// Set to 0 for normal operation (fingerprinting and location updates on Fridays)
#define CALIBRATION_MODE 0

// Sleep settings (in seconds)
#define SLEEP_DURATION_FRIDAY 1800    // 30 minutes on Friday
#define SLEEP_DURATION_WEEKDAY 21600  // 6 hours on other days

#endif
