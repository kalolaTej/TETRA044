/*
  Smart Non-Invasive Animal Deterrent System - ESP32 Firmware
  Track B: AgriTech - Problem Statement 2

  Features:
  - Wi-Fi Web Server (HTTP REST API: /trigger, /stop, /status)
  - Serial Communication Fallback (Command: "DETER:animal_name")
  - Visual Strobe: GPIO 4 (LED / Relay module for strobe lights)
  - Acoustic Frequencies & Sirens: GPIO 18 (PWM / Passive Buzzer for acoustic sweeps & ultrasonic tones)
  - DFPlayer Mini MP3 Audio Player (UART2: RX2=16, TX2=17) for predator & warning sounds
*/

#include <WiFi.h>
#include <WebServer.h>
#include <HardwareSerial.h>

// ==========================================
// CONFIGURATION - CHANGE YOUR WI-FI CREDENTIALS HERE
// ==========================================
const char* ssid = "CMF by Nothing Phone 2 Pro_8823";
const char* password = "himynameis";

// GPIO Pin Definitions
#define STROBE_PIN 4      // Strobe LED / Relay trigger
#define BUZZER_PIN 18     // Passive Buzzer PWM output pin
#define STATUS_LED 2      // Onboard status LED

// DFPlayer Mini Serial Pins (UART2)
#define DFPLAYER_RX 16
#define DFPLAYER_TX 17

// Global State
WebServer server(80);
HardwareSerial dfPlayerSerial(2); // UART2 for DFPlayer Mini MP3 module

bool deterrentActive = false;
unsigned long deterrentStartTime = 0;
unsigned long deterrentDurationMs = 5000; // Default 5 seconds active
String currentAnimal = "";

// PWM Channel configuration for Buzzer sound generation
#define BUZZER_CHANNEL 0
#define BUZZER_RESOLUTION 8

// DFPlayer Mini Raw Protocol Command Sender
void sendDFPlayerCommand(uint8_t cmd, uint16_t arg) {
  uint8_t buf[10];
  buf[0] = 0x7E; // Start byte
  buf[1] = 0xFF; // Version
  buf[2] = 0x06; // Length
  buf[3] = cmd;  // Command
  buf[4] = 0x00; // Feedback (0 = no feedback)
  buf[5] = (uint8_t)(arg >> 8);   // High byte of argument
  buf[6] = (uint8_t)(arg & 0xFF); // Low byte of argument

  // Calculate Checksum: - (Version + Length + Cmd + Feedback + High + Low)
  uint16_t checksum = 0;
  for (int i = 1; i < 7; i++) {
    checksum += buf[i];
  }
  checksum = -checksum;
  buf[7] = (uint8_t)(checksum >> 8);
  buf[8] = (uint8_t)(checksum & 0xFF);
  buf[9] = 0xEF; // End byte

  dfPlayerSerial.write(buf, 10);
}

void playDFPlayerTrack(uint16_t trackNumber) {
  sendDFPlayerCommand(0x06, 30); // Set volume to max (30)
  delay(50);
  sendDFPlayerCommand(0x03, trackNumber); // Play track (0001.mp3, 0002.mp3, etc.)
  Serial.print("[DFPlayer] Playing MP3 Track #");
  Serial.println(trackNumber);
}

void stopDFPlayer() {
  sendDFPlayerCommand(0x16, 0); // Stop playback
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n[ESP32] Initializing Smart Farm Deterrent System...");

  // Initialize Pin Modes
  pinMode(STROBE_PIN, OUTPUT);
  pinMode(STATUS_LED, OUTPUT);
  digitalWrite(STROBE_PIN, LOW);
  digitalWrite(STATUS_LED, LOW);

  // Setup PWM for Buzzer Tone Generation (ESP32 ledc)
  ledcSetup(BUZZER_CHANNEL, 2000, BUZZER_RESOLUTION);
  ledcAttachPin(BUZZER_PIN, BUZZER_CHANNEL);
  ledcWrite(BUZZER_CHANNEL, 0); // Silence initially

  // Initialize UART2 for DFPlayer Mini MP3 Player
  dfPlayerSerial.begin(9600, SERIAL_8N1, DFPLAYER_RX, DFPLAYER_TX);
  delay(200);
  sendDFPlayerCommand(0x06, 28); // Set default volume (28/30)

  // Connect to Wi-Fi
  Serial.print("[WiFi] Connecting to ");
  Serial.println(ssid);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  int wifiRetries = 0;
  while (WiFi.status() != WL_CONNECTED && wifiRetries < 20) {
    delay(500);
    Serial.print(".");
    digitalWrite(STATUS_LED, !digitalRead(STATUS_LED));
    wifiRetries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(STATUS_LED, HIGH);
    Serial.println("\n[WiFi] Connected!");
    Serial.print("[WiFi] ESP32 IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[WiFi Warning] Connection failed. Operating in SERIAL ONLY mode.");
    digitalWrite(STATUS_LED, LOW);
  }

  // Define HTTP REST API Routes
  server.on("/trigger", HTTP_GET, handleTrigger);
  server.on("/trigger", HTTP_POST, handleTrigger);
  server.on("/stop", HTTP_GET, handleStop);
  server.on("/stop", HTTP_POST, handleStop);
  server.on("/status", HTTP_GET, handleStatus);
  server.onNotFound([]() {
    server.send(404, "application/json", "{\"error\":\"Endpoint not found\"}");
  });

  server.begin();
  Serial.println("[HTTP] Web Server running on port 80");
  Serial.println("[System] Ready for Intrusion Alerts!");
}

void loop() {
  server.handleClient();
  checkSerialInput();
  updateDeterrentState();
}

// ----------------------------------------------------
// Deterrent Trigger Logic
// ----------------------------------------------------
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

  // Play corresponding MP3 track on DFPlayer Mini (if attached)
  if (animal == "pig" || animal == "boar") {
    playDFPlayerTrack(1); // 0001.mp3 - High pitch frequency / Predator growl
  } else if (animal == "cow" || animal == "buffalo" || animal == "horse") {
    playDFPlayerTrack(2); // 0002.mp3 - Barking dogs & Tiger roar
  } else if (animal == "dog" || animal == "cat" || animal == "goat" || animal == "sheep") {
    playDFPlayerTrack(3); // 0003.mp3 - Ultrasonic sweep & Firecracker sound
  } else {
    playDFPlayerTrack(4); // 0004.mp3 - Emergency Loud Siren
  }
}

void stopDeterrent() {
  deterrentActive = false;
  digitalWrite(STROBE_PIN, LOW);
  ledcWrite(BUZZER_CHANNEL, 0); // Turn off tone sound
  stopDFPlayer();                // Stop MP3 playback
  Serial.println("[DETERRENT STOPPED] Hardware silenced.");
}

void updateDeterrentState() {
  if (!deterrentActive) return;

  // Auto-stop after duration
  if (millis() - deterrentStartTime > deterrentDurationMs) {
    stopDeterrent();
    return;
  }

  // Dynamic Strobe Lighting Pattern (50ms toggle for high visibility)
  bool flashState = (millis() / 50) % 2 == 0;
  digitalWrite(STROBE_PIN, flashState ? HIGH : LOW);

  // Species-Specific Frequency Acoustic Patterns for Passive Buzzer
  if (currentAnimal == "pig" || currentAnimal == "boar") {
    // High-frequency sweep 12kHz to 18kHz for wild pigs
    int sweepFreq = 12000 + ((millis() / 10) % 6000);
    ledcWriteTone(BUZZER_CHANNEL, sweepFreq);
    ledcWrite(BUZZER_CHANNEL, 128); // 50% duty cycle
  } 
  else if (currentAnimal == "cow" || currentAnimal == "buffalo" || currentAnimal == "horse") {
    // Alternating loud dual-siren sound (800Hz / 1500Hz)
    int sirenFreq = ((millis() / 200) % 2 == 0) ? 800 : 1500;
    ledcWriteTone(BUZZER_CHANNEL, sirenFreq);
    ledcWrite(BUZZER_CHANNEL, 128);
  } 
  else if (currentAnimal == "dog" || currentAnimal == "cat" || currentAnimal == "goat" || currentAnimal == "sheep") {
    // Ultrasonic acoustic pulse (18kHz - 22kHz)
    int pulseFreq = 18000 + ((millis() / 5) % 4000);
    ledcWriteTone(BUZZER_CHANNEL, pulseFreq);
    ledcWrite(BUZZER_CHANNEL, 128);
  } 
  else {
    // General multi-frequency alert siren
    int genFreq = 1000 + ((millis() / 5) % 2500);
    ledcWriteTone(BUZZER_CHANNEL, genFreq);
    ledcWrite(BUZZER_CHANNEL, 128);
  }
}

// ----------------------------------------------------
// HTTP Request Handlers
// ----------------------------------------------------
void handleTrigger() {
  String animal = server.hasArg("animal") ? server.arg("animal") : "unknown";
  int duration = server.hasArg("duration") ? server.arg("duration").toInt() : 5000;

  triggerDeterrent(animal, duration);

  String response = "{\"status\":\"success\",\"message\":\"Deterrent triggered\",\"animal\":\"" + animal + "\"}";
  server.send(200, "application/json", response);
}

void handleStop() {
  stopDeterrent();
  server.send(200, "application/json", "{\"status\":\"success\",\"message\":\"Deterrent stopped\"}");
}

void handleStatus() {
  String ipStr = WiFi.localIP().toString();
  String activeStr = deterrentActive ? "true" : "false";
  String response = "{\"active\":" + activeStr + ",\"current_animal\":\"" + currentAnimal + "\",\"ip\":\"" + ipStr + "\"}";
  server.send(200, "application/json", response);
}

// ----------------------------------------------------
// Serial Input Handler (e.g. via USB Connection)
// Command format: DETER:pig  or STOP
// ----------------------------------------------------
void checkSerialInput() {
  if (Serial.available() > 0) {
    String input = Serial.readStringUntil('\n');
    input.trim();

    if (input.startsWith("DETER:")) {
      String animal = input.substring(6);
      triggerDeterrent(animal, 5000);
    } else if (input == "STOP") {
      stopDeterrent();
    }
  }
}
