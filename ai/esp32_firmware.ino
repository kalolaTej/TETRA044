/*
  Smart Non-Invasive Animal Deterrent System - ESP32 Firmware (Universal LED & Siren Fix)
  Track B: AgriTech - Problem Statement 2
*/

#include <WiFi.h>
#include <WebServer.h>
#include <HardwareSerial.h>

// ==========================================
// CONFIGURATION & PIN DEFINITIONS
// ==========================================
const char* ssid = "Wokwi-GUEST"; // Wi-Fi SSID
const char* password = "";        // Wi-Fi Password

// Multi-Pin LED Support (Flashes GPIO 2, GPIO 4, and GPIO 13 simultaneously)
#define STROBE_PIN_4 4     // External Strobe LED Pin (GPIO 4)
#define STROBE_PIN_13 13   // Secondary LED Pin (GPIO 13)
#define STATUS_LED_2 2     // Onboard ESP32 Blue LED Pin (GPIO 2)
#define BUZZER_PIN 18      // Loud Passive Siren Buzzer Pin (GPIO 18)

// DFPlayer Mini Serial Pins (UART2)
#define DFPLAYER_RX 16
#define DFPLAYER_TX 17

// Active State Configuration
// Set to true for Active-HIGH LEDs (HIGH = ON), or false for Active-LOW Relay/LED Modules (LOW = ON)
const bool LED_ACTIVE_HIGH = true; 

// Global State
WebServer server(80);
HardwareSerial dfPlayerSerial(2);

bool deterrentActive = false;
unsigned long deterrentStartTime = 0;
unsigned long deterrentDurationMs = 5000;
String currentAnimal = "";

void sendDFPlayerCommand(uint8_t cmd, uint16_t arg) {
  uint8_t buf[10];
  buf[0] = 0x7E; buf[1] = 0xFF; buf[2] = 0x06; buf[3] = cmd; buf[4] = 0x00;
  buf[5] = (uint8_t)(arg >> 8); buf[6] = (uint8_t)(arg & 0xFF);
  uint16_t checksum = 0;
  for (int i = 1; i < 7; i++) checksum += buf[i];
  checksum = -checksum;
  buf[7] = (uint8_t)(checksum >> 8); buf[8] = (uint8_t)(checksum & 0xFF); buf[9] = 0xEF;
  dfPlayerSerial.write(buf, 10);
}

void playDFPlayerTrack(uint16_t trackNumber) {
  sendDFPlayerCommand(0x06, 30); // Max Volume 30
  delay(50);
  sendDFPlayerCommand(0x03, trackNumber);
  Serial.print("[DFPlayer] Playing MP3 Track #");
  Serial.println(trackNumber);
}

void stopDFPlayer() {
  sendDFPlayerCommand(0x16, 0);
}

void setLeds(bool on) {
  uint8_t state = (on == LED_ACTIVE_HIGH) ? HIGH : LOW;
  digitalWrite(STROBE_PIN_4, state);
  digitalWrite(STROBE_PIN_13, state);
  digitalWrite(STATUS_LED_2, state);
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n[ESP32] Initializing Smart Farm Deterrent System...");

  // Configure all LED output pins
  pinMode(STROBE_PIN_4, OUTPUT);
  pinMode(STROBE_PIN_13, OUTPUT);
  pinMode(STATUS_LED_2, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  setLeds(false);
  digitalWrite(BUZZER_PIN, LOW);

  // 💡 BOOT HARDWARE TEST: Flash all LEDs 4 times on power-up to confirm physical wiring!
  Serial.println("[Hardware Test] Flashing LEDs on startup...");
  for (int i = 0; i < 4; i++) {
    setLeds(true);
    delay(200);
    setLeds(false);
    delay(200);
  }

  dfPlayerSerial.begin(9600, SERIAL_8N1, DFPLAYER_RX, DFPLAYER_TX);
  delay(200);
  sendDFPlayerCommand(0x06, 30);

  Serial.print("[WiFi] Connecting to ");
  Serial.println(ssid);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  int wifiRetries = 0;
  while (WiFi.status() != WL_CONNECTED && wifiRetries < 20) {
    delay(500);
    Serial.print(".");
    setLeds(wifiRetries % 2 == 0);
    wifiRetries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    setLeds(true);
    delay(500);
    setLeds(false);
    Serial.println("\n[WiFi] Connected!");
    Serial.print("[WiFi] ESP32 IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[WiFi Warning] Operating in SERIAL ONLY mode.");
    setLeds(false);
  }

  server.on("/trigger", HTTP_GET, handleTrigger);
  server.on("/trigger", HTTP_POST, handleTrigger);
  server.on("/stop", HTTP_GET, handleStop);
  server.on("/stop", HTTP_POST, handleStop);
  server.on("/status", HTTP_GET, handleStatus);

  server.begin();
  Serial.println("[HTTP] Web Server running on port 80");
  Serial.println("[System] Ready for Intrusion Alerts!");
}

void loop() {
  server.handleClient();
  checkSerialInput();
  updateDeterrentState();
}

void triggerDeterrent(String animal, int durationMs) {
  deterrentActive = true;
  deterrentStartTime = millis();
  deterrentDurationMs = (durationMs > 0) ? durationMs : 5000;
  currentAnimal = animal;

  Serial.print("[DETERRENT ACTIVATED] Species: ");
  Serial.print(animal);
  Serial.print(" | Duration: ");
  Serial.print(deterrentDurationMs);
  Serial.println("ms");

  if (animal == "pig" || animal == "boar") {
    playDFPlayerTrack(1);
  } else if (animal == "cow" || animal == "buffalo" || animal == "horse") {
    playDFPlayerTrack(2);
  } else if (animal == "dog" || animal == "cat" || animal == "goat" || animal == "sheep") {
    playDFPlayerTrack(3);
  } else {
    playDFPlayerTrack(4);
  }
}

void stopDeterrent() {
  deterrentActive = false;
  setLeds(false);
  noTone(BUZZER_PIN);
  digitalWrite(BUZZER_PIN, LOW);
  stopDFPlayer();
  Serial.println("[DETERRENT STOPPED] Hardware silenced.");
}

void updateDeterrentState() {
  if (!deterrentActive) return;

  if (millis() - deterrentStartTime > deterrentDurationMs) {
    stopDeterrent();
    return;
  }

  // Flash all LED pins (GPIO 2, 4, 13) at 150ms intervals for visible strobe effect
  bool flashState = (millis() / 150) % 2 == 0;
  setLeds(flashState);

  // Loud Siren Frequencies (2200 Hz - 3400 Hz)
  if (currentAnimal == "pig" || currentAnimal == "boar") {
    int sweepFreq = 2400 + ((millis() / 5) % 1000);
    tone(BUZZER_PIN, sweepFreq);
  } else if (currentAnimal == "cow" || currentAnimal == "buffalo" || currentAnimal == "horse") {
    int sirenFreq = ((millis() / 150) % 2 == 0) ? 2800 : 1800;
    tone(BUZZER_PIN, sirenFreq);
  } else if (currentAnimal == "dog" || currentAnimal == "cat" || currentAnimal == "goat" || currentAnimal == "sheep") {
    int pulseFreq = 3000 + ((millis() / 3) % 600);
    tone(BUZZER_PIN, pulseFreq);
  } else {
    int genFreq = 2200 + ((millis() / 10) % 1200);
    tone(BUZZER_PIN, genFreq);
  }
}

void handleTrigger() {
  String animal = server.hasArg("animal") ? server.arg("animal") : "unknown";
  int duration = server.hasArg("duration") ? server.arg("duration").toInt() : 5000;
  triggerDeterrent(animal, duration);
  server.send(200, "application/json", "{\"status\":\"success\",\"animal\":\"" + animal + "\"}");
}

void handleStop() {
  stopDeterrent();
  server.send(200, "application/json", "{\"status\":\"success\"}");
}

void handleStatus() {
  String activeStr = deterrentActive ? "true" : "false";
  server.send(200, "application/json", "{\"active\":" + activeStr + ",\"ip\":\"" + WiFi.localIP().toString() + "\"}");
}

void checkSerialInput() {
  if (Serial.available() > 0) {
    String input = Serial.readStringUntil('\n');
    input.trim();
    if (input.startsWith("DETER:")) {
      triggerDeterrent(input.substring(6), 5000);
    } else if (input == "STOP") {
      stopDeterrent();
    }
  }
}
