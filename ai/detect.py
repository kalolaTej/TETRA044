import os
import time
import json
import argparse
from datetime import datetime
import cv2
import requests
from ultralytics import YOLO
from config import load_config

def save_detection(config, frame, animal_name, conf, bbox, output_dir):
    timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S_%f")[:19]
    base_name = f"{animal_name}_{timestamp_str}"
    
    jpg_path = os.path.join(output_dir, f"{base_name}.jpg")
    json_path = os.path.join(output_dir, f"{base_name}.json")
    
    cv2.imwrite(jpg_path, frame)
    
    meta = {
        "timestamp": datetime.now().isoformat(),
        "camera_id": config["camera_id"],
        "zone_name": config["zone_name"],
        "animal": animal_name,
        "confidence": round(conf, 4),
        "bbox": [round(coord, 2) for coord in bbox],
        "image_file": os.path.basename(jpg_path)
    }
    
    with open(json_path, "w") as f:
        json.dump(meta, f, indent=2)
        
    print(f"[saved] snapshot saved -> {jpg_path}")
    return jpg_path

def send_detection(config, jpg_path, animal_name, conf):
    if config.get("dry_run", False):
        print(f"[dry-run] skipped sending detection to backend (dry-run mode active)")
        return True

    backend_url = config["backend_url"].rstrip("/")
    url = f"{backend_url}/api/detection"
    conf_pct = int(round(conf * 100))
    iso_time = datetime.now().isoformat()

    data = {
        "camera_id": config["camera_id"],
        "zone": config["zone_name"],
        "animal": animal_name,
        "confidence": str(conf_pct),
        "time": iso_time,
    }

    max_retries = 2
    timeout_sec = 3.0

    for attempt in range(1, max_retries + 1):
        try:
            with open(jpg_path, "rb") as img_file:
                files = {"image": (os.path.basename(jpg_path), img_file, "image/jpeg")}
                resp = requests.post(url, data=data, files=files, timeout=timeout_sec)
                
            if resp.status_code in (200, 201):
                print(f"[sent successfully] posted {animal_name} ({conf_pct}%) to backend ok")
                return True
            else:
                print(f"[api warning] backend returned status {resp.status_code}: {resp.text[:100]}")
        except requests.RequestException as err:
            if attempt < max_retries:
                time.sleep(0.5 * attempt)
            else:
                print(f"[api error] backend unreachable after {max_retries} attempts ({url}): {err}")
                
    return False

def main():
    parser = argparse.ArgumentParser(description="realtime animal intrusion detector")
    parser.add_argument("--source", help="override video source (webcam index, video file, or rtsp url)")
    parser.add_argument("--dry-run", action="store_true", help="run detection without sending payloads to backend")
    args = parser.parse_args()

    config = load_config()
    
    if args.source is not None:
        source_val = args.source.strip()
        if source_val.isdigit():
            config["camera_source"] = int(source_val)
        else:
            config["camera_source"] = source_val
            
    if args.dry_run:
        config["dry_run"] = True

    source = config["camera_source"]
    conf_thresh = config["confidence_threshold"]
    cooldown_sec = config["cooldown_seconds"]
    camera_id = config["camera_id"]
    target_animals = set(config["target_animals"])

    output_dir = os.path.join(os.path.dirname(__file__), "detections")
    os.makedirs(output_dir, exist_ok=True)

    print("[init] loading object detection model...")
    model = YOLO("yolo11s.pt")

    print(f"[source] opening camera source: {source}")
    cap = cv2.VideoCapture(source)

    if not cap.isOpened():
        print(f"[source error] failed to open video source '{source}'")
        return

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    print(f"[source opened] connected to stream: {width}x{height} @ {fps:.1f} fps")

    window_name = f"animal intrusion detection - {camera_id}"
    
    last_seen = {}
    last_skip_log = {}

    prev_time = time.time()
    current_fps = 0.0

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print("[stream] frame read failed or end of video stream reached")
                break

            curr_time = time.time()
            fps_delta = curr_time - prev_time
            prev_time = curr_time
            if fps_delta > 0:
                current_fps = 1.0 / fps_delta

            results = model(frame, conf=conf_thresh, verbose=False)
            annotated_frame = results[0].plot()

            boxes = results[0].boxes
            if boxes is not None and len(boxes) > 0:
                for box in boxes:
                    cls_id = int(box.cls[0])
                    class_name = model.names[cls_id].lower()
                    conf = float(box.conf[0])
                    
                    if class_name in target_animals and conf >= conf_thresh:
                        print(f"[detection found] detected {class_name} ({conf*100:.1f}%) on {camera_id}")
                        key = (camera_id, class_name)
                        last_time = last_seen.get(key, 0)
                        elapsed = curr_time - last_time
                        
                        if elapsed < cooldown_sec:
                            last_log = last_skip_log.get(key, 0)
                            if curr_time - last_log >= 1.0:
                                remaining = cooldown_sec - elapsed
                                print(f"[cooldown] skipped {class_name} on {camera_id} ({remaining:.1f}s remaining)")
                                last_skip_log[key] = curr_time
                            continue
                            
                        last_seen[key] = curr_time
                        bbox = box.xyxy[0].tolist()
                        jpg_path = save_detection(config, annotated_frame, class_name, conf, bbox, output_dir)
                        send_detection(config, jpg_path, class_name, conf)

            cv2.putText(
                annotated_frame,
                f"FPS: {current_fps:.1f}",
                (15, 35),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (0, 255, 0),
                2,
                cv2.LINE_AA,
            )

            cv2.imshow(window_name, annotated_frame)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                print("[user] quit preview window")
                break
    finally:
        cap.release()
        cv2.destroyAllWindows()
        print("[cleanup] camera stream released and windows closed")

if __name__ == "__main__":
    main()
