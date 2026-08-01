import os
import sys
import time
import json
import argparse
import threading
import urllib.request
from datetime import datetime
from collections import deque
import cv2
import numpy as np
import requests

try:
    from ultralytics import YOLO
except ImportError:
    YOLO = None

from config import load_config

infer_every_n = 1
infer_size = 540
display_width = 640

def apply_rotation(frame, angle):
    if frame is None or angle == 0:
        return frame
    norm_angle = angle % 360
    if norm_angle == 90:
        return cv2.rotate(frame, cv2.ROTATE_90_CLOCKWISE)
    elif norm_angle == 180:
        return cv2.rotate(frame, cv2.ROTATE_180)
    elif norm_angle == 270:
        return cv2.rotate(frame, cv2.ROTATE_90_COUNTERCLOCKWISE)
    return frame

class IPWebcamStream:
    def __init__(self, url):
        self.url = url
        self.latest_jpeg = None
        self.stopped = False
        self.lock = threading.Lock()

    def start(self):
        t = threading.Thread(target=self._run, daemon=True)
        t.start()
        return self

    def _run(self):
        while not self.stopped:
            try:
                print(f"[mjpeg stream] connecting to stream: {self.url}")
                req = urllib.request.urlopen(self.url, timeout=5)
                buf = b''
                while not self.stopped:
                    chunk = req.read(16384)
                    if not chunk:
                        break
                    buf += chunk
                    a = buf.find(b'\xff\xd8')
                    b = buf.find(b'\xff\xd9')
                    if a != -1 and b != -1 and b > a:
                        jpg_bytes = buf[a:b+2]
                        buf = buf[b+2:]
                        with self.lock:
                            self.latest_jpeg = jpg_bytes
            except Exception as err:
                print(f"[mjpeg error] connection notice: {err}")
                time.sleep(1.0)

    def read(self):
        with self.lock:
            if self.latest_jpeg is None:
                return False, None
            jpg_bytes = self.latest_jpeg
        frame = cv2.imdecode(np.frombuffer(jpg_bytes, dtype=np.uint8), cv2.IMREAD_COLOR)
        return (frame is not None), frame

    def release(self):
        self.stopped = True

class CamReader:
    def __init__(self, src):
        if isinstance(src, int) and sys.platform == 'win32':
            self.cap = cv2.VideoCapture(src, cv2.CAP_DSHOW)
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            self.cap.set(cv2.CAP_PROP_FPS, 30)
        else:
            self.cap = cv2.VideoCapture(src)

        self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        self.frame = None
        self.grabbed = False
        self.stopped = False
        self.lock = threading.Lock()

    def start(self):
        threading.Thread(target=self._run, daemon=True).start()
        return self

    def _run(self):
        while not self.stopped:
            ok, f = self.cap.read()
            if not ok:
                time.sleep(0.01)
                continue

            with self.lock:
                self.grabbed = ok
                self.frame = f

    def read(self):
        with self.lock:
            return (self.grabbed, self.frame.copy()) if self.frame is not None else (False, None)

    def release(self):
        self.stopped = True
        self.cap.release()

class Detector:
    def __init__(self, model, thresh, targets, cam_id, cooldown, cfg, out):
        self.model = model
        self.thresh = thresh
        self.targets = targets
        self.cam_id = cam_id
        self.cooldown = cooldown
        self.cfg = cfg
        self.out = out

        self._frame = None
        self._lock = threading.Lock()
        self._event = threading.Event()
        self._boxes = []
        self._seen = {}
        self.stopped = False

    def start(self):
        threading.Thread(target=self._loop, daemon=True).start()
        return self

    def submit(self, frame):
        with self._lock:
            self._frame = frame
        self._event.set()

    def boxes(self):
        with self._lock:
            return list(self._boxes)

    def _loop(self):
        while not self.stopped:
            self._event.wait(timeout=0.5)
            self._event.clear()
            with self._lock:
                f = self._frame
            if f is None:
                continue

            res = self.model(f, imgsz=infer_size, conf=self.thresh, verbose=False)
            bxs = res[0].boxes
            now = time.time()
            out = []

            if bxs is not None and len(bxs) > 0:
                for b in bxs:
                    cid = int(b.cls[0])
                    name = self.model.names[cid].lower()
                    conf = float(b.conf[0])
                    coords = [int(v) for v in b.xyxy[0].tolist()]
                    hit = name in self.targets and conf >= self.thresh
                    color = (0, 0, 255) if hit else (0, 255, 0)
                    out.append((f"{name} {conf*100:.0f}%", *coords, color))

                    if hit:
                        key = (self.cam_id, name)
                        if now - self._seen.get(key, 0) >= self.cooldown:
                            self._seen[key] = now
                            print(f"[detection] detected {name} ({conf*100:.1f}%) on {self.cam_id}")
                            self._send(f, name, conf, coords, out)

            with self._lock:
                self._boxes = out

    def _send(self, frame, name, conf, bbox, overlay):
        ann = frame.copy()
        for lbl, x1, y1, x2, y2, c in overlay:
            cv2.rectangle(ann, (x1, y1), (x2, y2), c, 2)
            cv2.putText(ann, lbl, (x1, y1 - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.6, c, 2)

        ts = datetime.now().strftime("%Y%m%d_%H%M%S_%f")[:19]
        jpg = os.path.join(self.out, f"{name}_{ts}.jpg")
        cv2.imwrite(jpg, ann)

        meta = {
            "timestamp": datetime.now().isoformat(),
            "camera_id": self.cfg["camera_id"],
            "zone_name": self.cfg["zone_name"],
            "animal": name,
            "confidence": round(conf, 4),
            "bbox": bbox,
        }
        with open(jpg.replace('.jpg', '.json'), 'w') as fp:
            json.dump(meta, fp, indent=2)

        print(f"[saved] snapshot -> {jpg}")
        threading.Thread(target=_upload, args=(self.cfg, jpg, name, conf), daemon=True).start()

    def stop(self):
        self.stopped = True

def _upload(cfg, jpg, animal, conf):
    if cfg.get("dry_run"):
        return
    url = cfg["backend_url"].rstrip("/") + "/api/detection"
    pct = int(round(conf * 100))
    body = {
        "camera_id": cfg["camera_id"],
        "zone": cfg["zone_name"],
        "animal": animal,
        "confidence": str(pct),
        "time": datetime.now().isoformat(),
    }
    for i in range(3):
        try:
            with open(jpg, "rb") as f:
                r = requests.post(url, data=body,
                                  files={"image": (os.path.basename(jpg), f, "image/jpeg")},
                                  timeout=10)
            if r.status_code in (200, 201):
                print(f"[sent] posted {animal} ({pct}%) to backend ok")
                return
        except Exception:
            time.sleep(0.3 * (i + 1))

def _is_file(src):
    if isinstance(src, int):
        return False
    s = str(src)
    if s.startswith(("http", "rtsp")):
        return False
    return any(s.lower().endswith(e) for e in ('.mp4', '.avi', '.mkv', '.mov', '.webm'))

def send_camera_heartbeat(cfg):
    url = cfg["backend_url"].rstrip("/") + "/api/cameras/heartbeat"
    body = {"camera_id": cfg["camera_id"], "status": True}
    while True:
        try:
            requests.post(url, json=body, timeout=3)
        except Exception:
            pass
        time.sleep(3.0)

def resize_display(frame, target_w=display_width):
    h, w = frame.shape[:2]
    if w <= target_w:
        return frame
    scale = target_w / w
    return cv2.resize(frame, (target_w, int(h * scale)), interpolation=cv2.INTER_NEAREST)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", help="camera index / file / url")
    ap.add_argument("--rotate", type=int, help="rotate angle (90, 180, 270)")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    cfg = load_config()
    if args.source:
        v = args.source.strip()
        cfg["camera_source"] = int(v) if v.isdigit() else v
    if args.rotate is not None:
        cfg["rotate_angle"] = args.rotate
    if args.dry_run:
        cfg["dry_run"] = True

    src = cfg["camera_source"]
    thresh = cfg["confidence_threshold"]
    cooldown = cfg.get("cooldown_seconds", 10)
    cam_id = cfg["camera_id"]
    targets = set(cfg["target_animals"])
    rotate_angle = cfg.get("rotate_angle", 0)

    out_dir = os.path.join(os.path.dirname(__file__), "detections")
    os.makedirs(out_dir, exist_ok=True)

    is_file = _is_file(src)
    print(f"[source] loading camera source: {src}")
    print(f"[config] confidence >= {thresh*100:.0f}% | cooldown = {cooldown}s | rotation = {rotate_angle}°")
    print(f"[controls] press 'r' to rotate 90° right, 'l' to rotate 90° left, 'q' to quit")

    # start background heartbeat thread
    threading.Thread(target=send_camera_heartbeat, args=(cfg,), daemon=True).start()

    model = None
    if YOLO:
        try:
            model = YOLO("yolo11n.pt")
            print("[init] yolo11-nano loaded successfully")
        except Exception as e:
            print(f"[init error] yolo load error: {e}")

    if is_file:
        cap = cv2.VideoCapture(src)
        native_fps = cap.get(cv2.CAP_PROP_FPS) or 25
        reader = None
    elif isinstance(src, str) and src.startswith("http"):
        reader = IPWebcamStream(src).start()
        time.sleep(0.5)
        cap = None
        native_fps = 30
    else:
        reader = CamReader(src).start()
        time.sleep(0.5)
        cap = None
        native_fps = 30

    det = Detector(model, thresh, targets, cam_id, cooldown, cfg, out_dir).start() if model else None

    win = f"animal intrusion detection - {cam_id}"
    fc = 0
    fps_q = deque(maxlen=30)

    try:
        while True:
            loop_t = time.time()

            if reader:
                ok, raw_frame = reader.read()
            else:
                ok, raw_frame = cap.read()
                if not ok and is_file:
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    continue

            if not ok or raw_frame is None:
                if reader and isinstance(src, str) and src.startswith("http"):
                    blank = np.zeros((480, 640, 3), dtype=np.uint8)
                    cv2.putText(blank, "Connecting to IP Camera...", (50, 200),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
                    cv2.putText(blank, f"URL: {src}", (50, 240),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
                    cv2.putText(blank, "Ensure 'Start server' is active in IP Webcam app", (50, 280),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 200, 255), 1)
                    cv2.imshow(win, blank)
                    if cv2.waitKey(50) & 0xFF == ord('q'):
                        break
                time.sleep(0.01)
                continue

            frame = apply_rotation(raw_frame, rotate_angle)

            fc += 1
            now = time.time()
            fps_q.append(now)
            avg_fps = (len(fps_q) - 1) / (fps_q[-1] - fps_q[0]) if len(fps_q) > 1 else 0

            if det and fc % infer_every_n == 0:
                det.submit(frame)

            if det:
                for lbl, x1, y1, x2, y2, clr in det.boxes():
                    cv2.rectangle(frame, (x1, y1), (x2, y2), clr, 2)
                    (tw, th), _ = cv2.getTextSize(lbl, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)
                    cv2.rectangle(frame, (x1, y1 - th - 6), (x1 + tw + 2, y1), clr, -1)
                    cv2.putText(frame, lbl, (x1 + 1, y1 - 3),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)

            cv2.putText(frame, f"FPS: {avg_fps:.1f} | Rot: {rotate_angle}° ('r'/'l' to rotate)", (15, 35),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2, cv2.LINE_AA)

            display = resize_display(frame)
            cv2.imshow(win, display)

            if is_file:
                elapsed = time.time() - loop_t
                wait = max(1, int((1.0 / native_fps - elapsed) * 1000))
            else:
                wait = 1

            key = cv2.waitKey(wait) & 0xFF
            if key == ord('q'):
                print("[user] quit preview window")
                break
            elif key == ord('r'):
                rotate_angle = (rotate_angle + 90) % 360
                print(f"[control] rotated 90° right -> new angle: {rotate_angle}°")
            elif key == ord('l'):
                rotate_angle = (rotate_angle - 90) % 360
                print(f"[control] rotated 90° left -> new angle: {rotate_angle}°")

    finally:
        if det:
            det.stop()
        if reader:
            reader.release()
        if cap:
            cap.release()
        cv2.destroyAllWindows()
        print("[cleanup] camera stream released and windows closed")

if __name__ == "__main__":
    main()
