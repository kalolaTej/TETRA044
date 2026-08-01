import os

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

def load_config():
    conf_thresh = get_env_float("CONFIDENCE_THRESHOLD", 0.35)
    
    if not (0.0 <= conf_thresh <= 1.0):
      print(f"warning: confidence threshold {conf_thresh} out of bounds, falling back to 0.35")
      conf_thresh = 0.35

    raw_cam = os.getenv("CAMERA_SOURCE", os.getenv("RTSP_STREAM_URL", "0"))
    
    default_animals = "cow,goat,pig,sheep,horse,dog,cat,bear,elephant,zebra,giraffe"
    raw_animals = os.getenv("TARGET_ANIMALS", default_animals)
    target_animals = [a.strip().lower() for a in raw_animals.split(",") if a.strip()]

    dry_run_env = os.getenv("DRY_RUN", "false").lower() in ("true", "1", "yes")

    return {
        "backend_url": os.getenv("BACKEND_URL", "http://localhost:5000"),
        "camera_source": parse_camera_source(raw_cam),
        "confidence_threshold": conf_thresh,
        "cooldown_seconds": get_env_int("COOLDOWN_SECONDS", 10),
        "camera_id": os.getenv("CAMERA_ID", "ebe80084-70f8-4874-b3a9-b47f2f72f534"),
        "zone_name": os.getenv("ZONE_NAME", "north_field"),
        "target_animals": target_animals,
        "rotate_angle": get_env_int("ROTATE_ANGLE", 0),
        "dry_run": dry_run_env,
    }
