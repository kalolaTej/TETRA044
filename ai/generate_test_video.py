"""Generate a test video by capturing frames from a public sample video URL.
Falls back to generating synthetic frames with text overlay if download fails."""
import cv2
import numpy as np
import os
import urllib.request

OUT_DIR = os.path.join(os.path.dirname(__file__), "test_video")
os.makedirs(OUT_DIR, exist_ok=True)
OUT_PATH = os.path.join(OUT_DIR, "cows.mp4")

# Public domain / CC0 sample video URLs to try
SAMPLE_URLS = [
    "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4",
    "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
]

def try_download():
    """Try to download a sample video file."""
    for url in SAMPLE_URLS:
        try:
            print(f"[download] trying: {url}")
            urllib.request.urlretrieve(url, OUT_PATH)
            # Verify it's a valid video
            cap = cv2.VideoCapture(OUT_PATH)
            if cap.isOpened() and cap.get(cv2.CAP_PROP_FRAME_COUNT) > 10:
                w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                fps = cap.get(cv2.CAP_PROP_FPS)
                fc = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
                cap.release()
                print(f"[download] success! {w}x{h} @ {fps:.0f} fps, {fc} frames")
                return True
            cap.release()
        except Exception as e:
            print(f"[download] failed: {e}")
    return False


def generate_synthetic():
    """Generate a 30-second synthetic test video with moving objects
    that YOLO can potentially detect (rectangles simulating animal shapes)."""
    W, H, FPS, DURATION = 1280, 720, 25, 30
    total_frames = FPS * DURATION

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    writer = cv2.VideoWriter(OUT_PATH, fourcc, FPS, (W, H))

    print(f"[generate] creating {DURATION}s synthetic test video at {W}x{H} @ {FPS} fps ...")

    # Create a grassy field background
    bg = np.zeros((H, W, 3), dtype=np.uint8)
    # Sky gradient (top half)
    for y in range(H // 2):
        ratio = y / (H // 2)
        bg[y, :] = [int(200 - 60 * ratio), int(180 - 40 * ratio), int(120 + 80 * ratio)]
    # Ground gradient (bottom half)
    for y in range(H // 2, H):
        ratio = (y - H // 2) / (H // 2)
        bg[y, :] = [int(30 + 20 * ratio), int(100 + 50 * ratio), int(40 + 30 * ratio)]

    # Moving "animal" objects
    objects = [
        {"x": 100, "y": 400, "w": 180, "h": 120, "dx": 2, "color": (80, 60, 40), "label": "cow"},
        {"x": 600, "y": 350, "w": 150, "h": 100, "dx": -1.5, "color": (120, 100, 80), "label": "cow"},
        {"x": 900, "y": 420, "w": 100, "h": 70, "dx": 1, "color": (60, 40, 30), "label": "dog"},
    ]

    for i in range(total_frames):
        frame = bg.copy()

        for obj in objects:
            # Move objects
            obj["x"] += obj["dx"]
            # Bounce at edges
            if obj["x"] < 0 or obj["x"] + obj["w"] > W:
                obj["dx"] *= -1

            x, y, w, h = int(obj["x"]), obj["y"], obj["w"], obj["h"]

            # Draw filled body
            cv2.rectangle(frame, (x, y), (x + w, y + h), obj["color"], -1)
            # Draw outline
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 0, 0), 2)
            # Head
            head_w, head_h = w // 3, h // 2
            hx = x + w if obj["dx"] > 0 else x - head_w
            cv2.rectangle(frame, (hx, y), (hx + head_w, y + head_h), obj["color"], -1)
            cv2.rectangle(frame, (hx, y), (hx + head_w, y + head_h), (0, 0, 0), 2)
            # Legs
            for lx in [x + w // 4, x + 3 * w // 4]:
                cv2.line(frame, (lx, y + h), (lx, y + h + 40), obj["color"], 4)

            # Label
            cv2.putText(frame, obj["label"].upper(), (x, y - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

        # Frame info
        sec = i / FPS
        cv2.putText(frame, f"TEST VIDEO - {sec:.1f}s", (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2)
        cv2.putText(frame, f"Frame {i+1}/{total_frames}", (20, 80),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 1)

        writer.write(frame)

        if (i + 1) % (FPS * 5) == 0:
            print(f"  [{i+1}/{total_frames}] {sec:.0f}s generated")

    writer.release()
    print(f"[generate] done! saved to {OUT_PATH}")


if __name__ == "__main__":
    if not try_download():
        print("[download] all download attempts failed, generating synthetic video instead")
        generate_synthetic()
    else:
        print(f"\n[ready] video saved to: {OUT_PATH}")
        print(f"  Run detection: python detect.py --source test_video/cows.mp4")
