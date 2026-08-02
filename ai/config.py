import os
import json

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

def get_env_float(key, default):
    val = os.getenv(key)
    if val is None:
        return default
    try:
        return float(val)
    except ValueError:
        return default

def get_env_int(key, default):
    val = os.getenv(key)
    if val is None:
        return default
    try:
        return int(val)
    except ValueError:
        return default

def parse_camera_source(val):
    if not val:
        return 0
    if str(val).isdigit():
        return int(val)
    s = str(val).strip()
    if s.startswith("http://") and ":8080" in s and not s.endswith("/video"):
        s = s.rstrip("/") + "/video"
    if not s.startswith(("http://", "https://", "rtsp://")):
        ai_dir = os.path.dirname(os.path.abspath(__file__))
        abs_path = os.path.join(ai_dir, s)
        if os.path.isfile(abs_path):
            return abs_path
    return s

def parse_multi_cameras():
    """
    Parses multi-camera configurations from environment.
    Supports JSON string in CAMERAS_JSON, or formatted string in CAMERAS_LIST (id|url|zone,id|url|zone),
    or fallback to single camera config.
    """
    cameras_json = os.getenv("CAMERAS_JSON")
    if cameras_json:
        try:
            parsed = json.loads(cameras_json)
            if isinstance(parsed, list):
                return [
                    {
                        "id": c.get("id", f"cam_0{i+1}"),
                        "source": parse_camera_source(c.get("source") or c.get("url")),
                        "zone": c.get("zone", f"Zone {i+1}")
                    }
                    for i, c in enumerate(parsed)
                ]
        except Exception as e:
            print(f"warning: failed to parse CAMERAS_JSON: {e}")

    cameras_list = os.getenv("CAMERAS_LIST")
    if cameras_list:
        camera_entries = []
        for i, item in enumerate(cameras_list.split(",")):
            parts = item.strip().split("|")
            if len(parts) >= 2:
                cam_id = parts[0].strip()
                cam_url = parse_camera_source(parts[1].strip())
                cam_zone = parts[2].strip() if len(parts) >= 3 else f"Zone {i+1}"
                camera_entries.append({"id": cam_id, "source": cam_url, "zone": cam_zone})
            elif len(parts) == 1 and parts[0].strip():
                camera_entries.append({
                    "id": f"cam_0{i+1}",
                    "source": parse_camera_source(parts[0].strip()),
                    "zone": f"Zone {i+1}"
                })
        if camera_entries:
            return camera_entries

    # single camera fallback
    raw_cam = os.getenv("CAMERA_SOURCE", os.getenv("RTSP_STREAM_URL", "0"))
    camera_id = os.getenv("CAMERA_ID", "ebe80084-70f8-4874-b3a9-b47f2f72f534")
    zone_name = os.getenv("ZONE_NAME", "north_field")
    return [{
        "id": camera_id,
        "source": parse_camera_source(raw_cam),
        "zone": zone_name
    }]

def load_config():
    conf_thresh = get_env_float("CONFIDENCE_THRESHOLD", 0.35)
    
    if not (0.0 <= conf_thresh <= 1.0):
        print(f"warning: confidence threshold {conf_thresh} out of bounds, falling back to 0.35")
        conf_thresh = 0.35

    default_animals = "cow,goat,pig,sheep,horse,dog,cat,bear,elephant,zebra,giraffe"
    raw_animals = os.getenv("TARGET_ANIMALS", default_animals)
    target_animals = [a.strip().lower() for a in raw_animals.split(",") if a.strip()]

    dry_run_env = os.getenv("DRY_RUN", "false").lower() in ("true", "1", "yes")
    cameras = parse_multi_cameras()

    return {
        "backend_url": os.getenv("BACKEND_URL", "http://localhost:5000"),
        "cameras": cameras,
        "camera_source": cameras[0]["source"],
        "camera_id": cameras[0]["id"],
        "zone_name": cameras[0]["zone"],
        "confidence_threshold": conf_thresh,
        "cooldown_seconds": get_env_int("COOLDOWN_SECONDS", 10),
        "target_animals": target_animals,
        "rotate_angle": get_env_int("ROTATE_ANGLE", 0),
        "dry_run": dry_run_env,
    }
