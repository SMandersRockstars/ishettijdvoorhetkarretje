#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <time.h>
#include "config.h"

void connectToWiFi();
void syncTime();
void scanWiFiNetworks();
void performCalibration();
void performLocationTracking();
void postLocation(String zone);
void fetchFingerprints();
String getISOTimestamp();
void sleepMode();
void printDebug(String message);

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
  printDebug("=== Cart Tracker Booting ===");
  printDebug(CALIBRATION_MODE ? "Mode: CALIBRATION" : "Mode: NORMAL");
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  connectToWiFi();
  syncTime();
  if (!CALIBRATION_MODE) {
    fetchFingerprints();
  }
}

void loop() {
  if (CALIBRATION_MODE) {
    printDebug("Waiting for button press...");
    while (digitalRead(BUTTON_PIN) == HIGH) {
      delay(100);
    }
    delay(50);
    printDebug("Button pressed! Scanning...");
    performCalibration();
  } else {
    performLocationTracking();
    sleepMode();
  }
}

void connectToWiFi() {
  printDebug("Connecting to WiFi: " + String(WIFI_SSID));
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    printDebug("WiFi connected! IP: " + WiFi.localIP().toString());
  } else {
    printDebug("WiFi connection failed");
  }
}

void syncTime() {
  printDebug("Syncing time with NTP...");
  configTime(0, 0, NTP_SERVER);
  time_t now = time(nullptr);
  int attempts = 0;
  while (now < 24 * 3600 && attempts < 20) {
    delay(500);
    now = time(nullptr);
    attempts++;
  }
  if (now > 24 * 3600) {
    printDebug("Time synced!");
  } else {
    printDebug("NTP sync failed");
  }
}

void scanWiFiNetworks() {
  printDebug("Scanning WiFi networks...");
  networkCount = WiFi.scanNetworks();
  if (networkCount == 0) {
    printDebug("No networks found");
    return;
  }
  printDebug("Found " + String(networkCount) + " networks");
  for (int i = 0; i < networkCount && i < 50; i++) {
    networks[i].rssi = WiFi.RSSI(i);
    strcpy(networks[i].bssid, WiFi.BSSIDstr(i).c_str());
    strcpy(networks[i].ssid, WiFi.SSID(i).c_str());
    printDebug("  " + String(networks[i].ssid) + " (" + String(networks[i].bssid) + ") RSSI: " + String(networks[i].rssi));
  }
}

void performCalibration() {
  printDebug("=== CALIBRATION SCAN ===");
  scanWiFiNetworks();
  if (networkCount == 0 || WiFi.status() != WL_CONNECTED) {
    printDebug("Cannot calibrate: no networks or WiFi down");
    return;
  }
  StaticJsonDocument<4096> doc;
  JsonArray readingsArray = doc.createNestedArray("readings");
  for (int i = 0; i < networkCount; i++) {
    JsonObject reading = readingsArray.createNestedObject();
    reading["bssid"] = networks[i].bssid;
    reading["ssid"] = networks[i].ssid;
    reading["rssi"] = networks[i].rssi;
  }
  HTTPClient http;
  String url = String(SERVER_URL) + "/api/calibrate/pending";
  http.begin(url);
  http.addHeader("X-Api-Key", API_KEY);
  http.addHeader("Content-Type", "application/json");
  String jsonString;
  serializeJson(doc, jsonString);
  int httpResponseCode = http.POST(jsonString);
  printDebug(httpResponseCode == 200 ? "Scan sent! Assign zone in web UI." : "POST failed: " + String(httpResponseCode));
  http.end();
}

void performLocationTracking() {
  printDebug("=== LOCATION TRACKING ===");
  time_t now = time(nullptr);
  struct tm* timeinfo = localtime(&now);
  int dayOfWeek = timeinfo->tm_wday;
  printDebug("Day=" + String(dayOfWeek) + " Time=" + String(timeinfo->tm_hour) + ":" + String(timeinfo->tm_min));
  if (dayOfWeek != 5) {
    printDebug("Not Friday, sleeping...");
    sleepMode();
    return;
  }
  scanWiFiNetworks();
  JsonObject fp = fingerprints.as<JsonObject>();
  if (networkCount == 0 || fp.isNull()) {
    printDebug("No networks or fingerprints, sleeping...");
    sleepMode();
    return;
  }
  String bestZone = "unknown";
  float bestDistance = 999999.0;
  for (JsonPair kv : fp) {
    String zoneId = kv.key().c_str();
    JsonObject zoneFingerprint = kv.value().as<JsonObject>();
    float distance = 0.0;
    int matchingAps = 0;
    for (JsonPair apKv : zoneFingerprint) {
      String bssid = apKv.key().c_str();
      int storedRssi = apKv.value();
      for (int i = 0; i < networkCount; i++) {
        if (String(networks[i].bssid) == bssid) {
          float diff = networks[i].rssi - storedRssi;
          distance += (diff * diff);
          matchingAps++;
          break;
        }
      }
    }
    if (matchingAps > 0) {
      distance = sqrt(distance / matchingAps);
      printDebug("  " + zoneId + ": distance=" + String(distance));
      if (distance < bestDistance) {
        bestDistance = distance;
        bestZone = zoneId;
      }
    }
  }
  printDebug("Best match: " + bestZone);
  postLocation(bestZone);
}

void postLocation(String zone) {
  if (!WiFi.isConnected()) return;
  HTTPClient http;
  StaticJsonDocument<256> doc;
  doc["zone"] = zone;
  doc["timestamp"] = getISOTimestamp();
  String jsonString;
  serializeJson(doc, jsonString);
  http.begin(String(SERVER_URL) + "/api/location");
  http.addHeader("X-Api-Key", API_KEY);
  http.addHeader("Content-Type", "application/json");
  int code = http.POST(jsonString);
  printDebug(code == 200 ? "Location posted!" : "POST failed: " + String(code));
  http.end();
}

void fetchFingerprints() {
  if (!WiFi.isConnected()) return;
  HTTPClient http;
  http.begin(String(SERVER_URL) + "/api/calibrate/fingerprints");
  int code = http.GET();
  if (code == 200) {
    DeserializationError error = deserializeJson(fingerprints, http.getString());
    if (!error) {
      int count = 0;
      for (JsonPair kv : fingerprints.as<JsonObject>()) count++;
      printDebug("Fingerprints fetched: " + String(count) + " zones");
    } else {
      printDebug("JSON parse error: " + String(error.c_str()));
    }
  } else {
    printDebug("Failed to fetch fingerprints: " + String(code));
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
  time_t now = time(nullptr);
  struct tm* timeinfo = localtime(&now);
  uint32_t sleepSeconds = (timeinfo->tm_wday == 5) ? SLEEP_DURATION_FRIDAY : SLEEP_DURATION_WEEKDAY;
  printDebug("Sleeping for " + String(sleepSeconds / 60) + " minutes...");
  esp_sleep_enable_timer_wakeup(sleepSeconds * 1000000ULL);
  esp_deep_sleep_start();
}

void printDebug(String message) {
  Serial.println("[" + String(millis() / 1000.0, 2) + "s] " + message);
}
