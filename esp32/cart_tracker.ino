/*
  Cart Tracker - ESP32 WiFi Location Based on RSSI Fingerprinting

  This sketch reads WiFi signal strengths and either:
  1. (Calibration mode) Stores RSSI readings for a zone
  2. (Normal mode) Compares against stored fingerprints to determine location and POST on Fridays
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <time.h>
#include "config.h"

// Forward declarations
void setup();
void loop();
void connectToWiFi();
void syncTime();
void scanWiFiNetworks();
void performCalibration();
void performLocationTracking();
void postLocation(String zone);
void sleepMode();
void printDebug(String message);

// Structures and globals
struct WiFiNetwork {
  char bssid[18];
  char ssid[33];
  int rssi;
};

WiFiNetwork networks[50];
int networkCount = 0;
JsonDocument fingerprints;

void setup() {
  Serial.begin(115200);
  delay(1000);

  printDebug("\n\n=== 🛒 Cart Tracker ESP32 Booting ===");
  printDebug(CALIBRATION_MODE ? "Mode: CALIBRATION" : "Mode: NORMAL");

  // Set up button pin
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  // Connect to WiFi
  connectToWiFi();

  // Sync time with NTP
  syncTime();

  // In normal mode, fetch fingerprints
  if (!CALIBRATION_MODE) {
    fetchFingerprints();
  }
}

void loop() {
  // Check if BOOT button is pressed (for manual calibration trigger)
  if (digitalRead(BUTTON_PIN) == LOW) {
    printDebug("🔘 Button pressed!");
    delay(500); // Debounce
  }

  if (CALIBRATION_MODE) {
    performCalibration();
  } else {
    performLocationTracking();
  }

  sleepMode();
}

void connectToWiFi() {
  printDebug("📡 Connecting to WiFi: " + String(WIFI_SSID));

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    printDebug("\n✅ WiFi connected!");
    printDebug("IP: " + WiFi.localIP().toString());
  } else {
    printDebug("\n❌ WiFi connection failed");
  }
}

void syncTime() {
  printDebug("🕐 Syncing time with NTP...");

  // Set timezone to UTC (can be customized)
  configTime(0, 0, NTP_SERVER);

  time_t now = time(nullptr);
  int attempts = 0;
  while (now < 24 * 3600 && attempts < 20) {
    delay(500);
    now = time(nullptr);
    attempts++;
  }

  if (now > 24 * 3600) {
    struct tm timeinfo = *localtime(&now);
    printDebug("✅ Time synced: " + String(asctime(&timeinfo)));
  } else {
    printDebug("❌ NTP sync failed");
  }
}

void scanWiFiNetworks() {
  printDebug("🔍 Scanning WiFi networks...");

  networkCount = WiFi.scanNetworks();

  if (networkCount == 0) {
    printDebug("❌ No networks found");
    return;
  }

  printDebug("Found " + String(networkCount) + " networks:");

  for (int i = 0; i < networkCount && i < 50; i++) {
    networks[i].rssi = WiFi.RSSI(i);
    strcpy(networks[i].bssid, WiFi.BSSIDstr(i).c_str());
    strcpy(networks[i].ssid, WiFi.SSID(i).c_str());

    printDebug("  [" + String(i) + "] " + String(networks[i].ssid) + " (" +
               String(networks[i].bssid) + ") RSSI: " + String(networks[i].rssi));
  }
}

void performCalibration() {
  printDebug("\n📊 === CALIBRATION MODE ===");
  printDebug("Scanning WiFi and sending to calibration API...");

  scanWiFiNetworks();

  if (networkCount == 0) {
    printDebug("❌ No networks to calibrate");
    sleepMode();
    return;
  }

  // Create JSON payload
  StaticJsonDocument<4096> doc;
  doc["zone"] = "test_zone"; // In real use, this would be passed or selected
  JsonArray readingsArray = doc.createNestedArray("readings");

  for (int i = 0; i < networkCount; i++) {
    JsonObject reading = readingsArray.createNestedObject();
    reading["bssid"] = networks[i].bssid;
    reading["ssid"] = networks[i].ssid;
    reading["rssi"] = networks[i].rssi;
  }

  // Send to server
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = String(SERVER_URL) + "/api/calibrate/scan";
    http.begin(url);
    http.addHeader("X-Api-Key", API_KEY);
    http.addHeader("Content-Type", "application/json");

    String jsonString;
    serializeJson(doc, jsonString);

    printDebug("📤 POSTing to " + url);
    int httpResponseCode = http.POST(jsonString);

    if (httpResponseCode == 200) {
      printDebug("✅ Calibration data sent! Response: " + String(httpResponseCode));
    } else {
      printDebug("❌ POST failed! Response: " + String(httpResponseCode));
    }

    http.end();
  } else {
    printDebug("❌ WiFi not connected");
  }

  sleepMode();
}

void performLocationTracking() {
  printDebug("\n📍 === LOCATION TRACKING MODE ===");

  // Check if it's Friday
  time_t now = time(nullptr);
  struct tm* timeinfo = localtime(&now);
  int dayOfWeek = timeinfo->tm_wday;  // 0=Sunday, 5=Friday
  int hour = timeinfo->tm_hour;
  int minute = timeinfo->tm_min;

  printDebug("Current: Day=" + String(dayOfWeek) + " Time=" + String(hour) + ":" + String(minute));

  bool isFriday = (dayOfWeek == 5);

  if (!isFriday) {
    printDebug("⏸️  Not Friday, skipping location update. Sleeping...");
    sleepMode();
    return;
  }

  // It's Friday! Scan and determine location
  scanWiFiNetworks();

  if (networkCount == 0 || fingerprints.isNull()) {
    printDebug("⚠️  No networks or fingerprints available");
    sleepMode();
    return;
  }

  // Find best matching zone
  String bestZone = "unknown";
  float bestDistance = 999999.0;

  // Iterate through stored fingerprints and compare
  for (JsonPair kv : fingerprints.as<JsonObject>()) {
    String zoneId = kv.key().c_str();
    JsonObject zoneFingerprint = kv.value();

    // Calculate Euclidean distance
    float distance = 0.0;
    int matchingAps = 0;

    for (JsonPair apKv : zoneFingerprint.as<JsonObject>()) {
      String bssid = apKv.key().c_str();
      int storedRssi = apKv.value();

      // Find this BSSID in current scan
      for (int i = 0; i < networkCount; i++) {
        if (String(networks[i].bssid) == bssid) {
          int currentRssi = networks[i].rssi;
          float diff = currentRssi - storedRssi;
          distance += (diff * diff);
          matchingAps++;
          break;
        }
      }
    }

    if (matchingAps > 0) {
      distance = sqrt(distance / matchingAps);
      printDebug("  " + zoneId + ": distance=" + String(distance) + " (APs: " + String(matchingAps) + ")");

      if (distance < bestDistance) {
        bestDistance = distance;
        bestZone = zoneId;
      }
    }
  }

  printDebug("✅ Best match: " + bestZone + " (distance: " + String(bestDistance) + ")");
  postLocation(bestZone);

  sleepMode();
}

void postLocation(String zone) {
  if (!WiFi.isConnected()) {
    printDebug("❌ WiFi not connected");
    return;
  }

  HTTPClient http;
  String url = String(SERVER_URL) + "/api/location";

  // Create JSON payload
  StaticJsonDocument<256> doc;
  doc["zone"] = zone;
  doc["timestamp"] = getISOTimestamp();

  http.begin(url);
  http.addHeader("X-Api-Key", API_KEY);
  http.addHeader("Content-Type", "application/json");

  String jsonString;
  serializeJson(doc, jsonString);

  printDebug("📤 POSTing location to " + url);
  int httpResponseCode = http.POST(jsonString);

  if (httpResponseCode == 200) {
    printDebug("✅ Location posted! Response: " + String(httpResponseCode));
  } else {
    printDebug("❌ POST failed! Response: " + String(httpResponseCode));
  }

  http.end();
}

void fetchFingerprints() {
  if (!WiFi.isConnected()) {
    printDebug("❌ WiFi not connected, skipping fingerprint fetch");
    return;
  }

  HTTPClient http;
  String url = String(SERVER_URL) + "/api/calibrate/fingerprints";

  http.begin(url);
  int httpResponseCode = http.GET();

  if (httpResponseCode == 200) {
    String payload = http.getString();
    DeserializationError error = deserializeJson(fingerprints, payload);

    if (!error) {
      printDebug("✅ Fingerprints fetched!");
      int zoneCount = 0;
      for (JsonPair kv : fingerprints.as<JsonObject>()) {
        zoneCount++;
      }
      printDebug("   Found " + String(zoneCount) + " zones");
    } else {
      printDebug("❌ JSON parse error: " + String(error.c_str()));
    }
  } else {
    printDebug("❌ Failed to fetch fingerprints! Response: " + String(httpResponseCode));
  }

  http.end();
}

String getISOTimestamp() {
  time_t now = time(nullptr);
  struct tm* timeinfo = localtime(&now);
  char buffer[25];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%SZ", timeinfo);
  return String(buffer);
}

void sleepMode() {
  // Determine sleep duration based on day of week
  time_t now = time(nullptr);
  struct tm* timeinfo = localtime(&now);
  int dayOfWeek = timeinfo->tm_wday;

  uint32_t sleepSeconds = (dayOfWeek == 5) ? SLEEP_DURATION_FRIDAY : SLEEP_DURATION_WEEKDAY;

  printDebug("💤 Deep sleep for " + String(sleepSeconds) + " seconds (" +
             String(sleepSeconds / 60) + " minutes)...");
  printDebug("===================================\n");

  // Deep sleep
  esp_sleep_enable_timer_wakeup(sleepSeconds * 1000000ULL);
  esp_deep_sleep_start();
}

void printDebug(String message) {
  Serial.println("[" + String(millis() / 1000.0, 2) + "s] " + message);
}
