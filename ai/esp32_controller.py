import os
import threading
import time
import requests

try:
    import winsound
except ImportError:
    winsound = None

try:
    import serial
except ImportError:
    serial = None

class ESP32Controller:
    """
    Thread-safe ESP32 Deterrent Hardware Controller with Audio Fallback.
    Triggers lights and acoustic frequency deterrents on ESP32 over Wi-Fi (HTTP) or USB (Serial).
    If ESP32 IP is unreachable (e.g. testing Wokwi simulator), plays PC sound chime as a fallback.
    """
    def __init__(self, config):
        self.enabled = config.get("esp32_enabled", True)
        self.mode = config.get("esp32_mode", "http").lower() # "http" or "serial"
        self.ip = config.get("esp32_ip", "192.168.1.150")
        self.port = config.get("esp32_port", 80)
        self.serial_port = config.get("esp32_serial_port", "COM3")
        self.baud = config.get("esp32_baud", 115200)
        self.duration = config.get("esp32_duration_ms", 5000)

        self.serial_conn = None

        if self.enabled:
            print(f"[esp32] Hardware Deterrent Controller initialized (Mode: {self.mode.upper()}, IP: {self.ip})")
            if self.mode == "serial" and serial is not None:
                self._init_serial()

    def _init_serial(self):
        try:
            self.serial_conn = serial.Serial(self.serial_port, self.baud, timeout=1)
            time.sleep(2) # Allow ESP32 serial reset
            print(f"[esp32] Connected to Serial port {self.serial_port} @ {self.baud} baud")
        except Exception as e:
            print(f"[esp32 serial warning] Serial port {self.serial_port} not open: {e}")

    def trigger(self, animal, confidence=1.0):
        if not self.enabled:
            return

        # Launch trigger request in background thread to keep OpenCV video FPS fast
        thread = threading.Thread(
            target=self._send_trigger,
            args=(animal, confidence),
            daemon=True
        )
        thread.start()

    def _play_local_pc_sound(self, animal):
        """PC Speaker siren sound fallback when testing without physical ESP32 connected."""
        if winsound:
            try:
                # Play alternating siren beep tones on PC speaker
                for _ in range(3):
                    winsound.Beep(1200, 150)
                    winsound.Beep(800, 150)
            except Exception:
                pass

    def _send_trigger(self, animal, confidence):
        if self.mode == "http":
            url = f"http://{self.ip}:{self.port}/trigger"
            params = {
                "animal": animal,
                "duration": self.duration,
                "confidence": int(round(confidence * 100))
            }
            try:
                resp = requests.get(url, params=params, timeout=1.5)
                if resp.status_code == 200:
                    print(f"[esp32 http] 🚨 Deterrent triggered for '{animal}' on ESP32 ({self.ip})")
                else:
                    print(f"[esp32 http warning] ESP32 status {resp.status_code}")
                    self._play_local_pc_sound(animal)
            except requests.RequestException:
                print(f"[esp32 note] Could not reach ESP32 at http://{self.ip} (IP unreachable). Playing PC audio chime...")
                self._play_local_pc_sound(animal)

        elif self.mode == "serial":
            if self.serial_conn and self.serial_conn.is_open:
                try:
                    cmd = f"DETER:{animal}\n"
                    self.serial_conn.write(cmd.encode("utf-8"))
                    print(f"[esp32 serial] 🚨 Sent '{cmd.strip()}' over {self.serial_port}")
                except Exception as e:
                    print(f"[esp32 serial error] Write failed: {e}")
                    self._play_local_pc_sound(animal)
            else:
                self._play_local_pc_sound(animal)

    def stop(self):
        if not self.enabled:
            return

        if self.mode == "http":
            url = f"http://{self.ip}:{self.port}/stop"
            try:
                requests.get(url, timeout=1.5)
            except Exception:
                pass
        elif self.mode == "serial" and self.serial_conn and self.serial_conn.is_open:
            try:
                self.serial_conn.write(b"STOP\n")
            except Exception:
                pass

    def close(self):
        if self.serial_conn and self.serial_conn.is_open:
            self.serial_conn.close()
