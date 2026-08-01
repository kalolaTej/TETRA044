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
    return val

def load_config():
    conf_thresh = get_env_float("CONFIDENCE_THRESHOLD", 0.5)
    
    # clamp threshold within valid probability bounds
    if not (0.0 <= conf_thresh <= 1.0):
        print(f"warning: confidence threshold {conf_thresh} out of bounds (0-1), falling back to 0.5")
        conf_thresh = 0.5

    raw_cam = os.getenv("CAMERA_SOURCE", os.getenv("RTSP_STREAM_URL", "0"))
    
    default_animals = "cow,goat,pig,sheep,horse,dog,cat,bear,elephant,zebra,giraffe"
    raw_animals = os.getenv("TARGET_ANIMALS", default_animals)
    target_animals = [a.strip().lower() for a in raw_animals.split(",") if a.strip()]

    return {
        "backend_url": os.getenv("BACKEND_URL", "http://localhost:5000"),
        "camera_source": parse_camera_source(raw_cam),
        "confidence_threshold": conf_thresh,
        "cooldown_seconds": get_env_int("COOLDOWN_SECONDS", 10),
        "camera_id": os.getenv("CAMERA_ID", "cam_01"),
        "zone_name": os.getenv("ZONE_NAME", "north_field"),
        "target_animals": target_animals,
    }
