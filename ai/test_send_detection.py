import os
import sys
import argparse
from datetime import datetime
import io
import requests
from PIL import Image, ImageDraw

def create_sample_image():
    img = Image.new("RGB", (320, 240), color=(60, 120, 60))
    draw = ImageDraw.Draw(img)
    draw.rectangle([50, 50, 270, 190], outline=(255, 255, 255), width=3)
    draw.text((60, 60), "TEST DETECTION", fill=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)
    return buf.getvalue()

def send_test_detection(args):
    backend_url = args.url.rstrip("/")
    endpoint = f"{backend_url}/api/detection"
    
    time_str = datetime.now().isoformat()
    payload = {
        "camera_id": args.camera,
        "zone": args.zone,
        "animal": args.animal,
        "confidence": str(args.confidence),
        "time": time_str
    }
    
    if args.image and os.path.exists(args.image):
        with open(args.image, "rb") as f:
            img_bytes = f.read()
        filename = os.path.basename(args.image)
    else:
        img_bytes = create_sample_image()
        filename = "test_sample.jpg"

    files = {
        "image": (filename, img_bytes, "image/jpeg")
    }

    print(f"sending test detection -> {endpoint}")
    print(f"payload: {payload}")
    
    try:
        res = requests.post(endpoint, data=payload, files=files, timeout=5.0)
        print(f"response status: {res.status_code}")
        try:
            print("response body:", res.json())
        except Exception:
            print("response text:", res.text)

        if res.status_code in (200, 201):
            print("success: test detection successfully ingested by backend!")
            return True
        else:
            print("error: backend rejected test detection request.")
            return False
    except Exception as err:
        print(f"request failed: {err}")
        return False

def main():
    parser = argparse.ArgumentParser(description="end-to-end test script for animal detection ingestion")
    parser.add_argument("--camera", default=os.getenv("CAMERA_ID", "cam_01"), help="camera id identifier")
    parser.add_argument("--zone", default=os.getenv("ZONE_NAME", "north_field"), help="zone name")
    parser.add_argument("--animal", default="cow", help="animal label")
    parser.add_argument("--confidence", type=int, default=95, help="confidence percentage 0-100")
    parser.add_argument("--image", default=None, help="path to custom test image file")
    parser.add_argument("--url", default=os.getenv("BACKEND_URL", "http://localhost:5000"), help="backend server base url")
    
    args = parser.parse_args()
    send_test_detection(args)

if __name__ == "__main__":
    main()
