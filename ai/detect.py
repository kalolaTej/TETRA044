import time
import cv2
from ultralytics import YOLO
from config import load_config

def main():
    config = load_config()
    source = config["camera_source"]
    conf_thresh = config["confidence_threshold"]

    # load model once before loop
    print("loading object detection model...")
    model = YOLO("yolo11s.pt")

    print(f"opening camera source: {source}")
    cap = cv2.VideoCapture(source)

    if not cap.isOpened():
        print(f"error: failed to open video source '{source}'")
        return

    # print camera source stream properties
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    print(f"connected: {width}x{height} @ {fps:.1f} fps")

    window_name = f"animal intrusion detection - {config['camera_id']}"
    
    prev_time = time.time()
    current_fps = 0.0

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print("warning: frame read failed or end of stream reached")
                break

            # calculate inference and rendering fps
            curr_time = time.time()
            fps_delta = curr_time - prev_time
            prev_time = curr_time
            if fps_delta > 0:
                current_fps = 1.0 / fps_delta

            # run object detection on frame
            results = model(frame, conf=conf_thresh, verbose=False)
            annotated_frame = results[0].plot()

            # overlay live fps counter on top-left
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

            # press q to quit preview
            if cv2.waitKey(1) & 0xFF == ord('q'):
                print("user quit preview")
                break
    finally:
        cap.release()
        cv2.destroyAllWindows()
        print("camera released and windows closed")

if __name__ == "__main__":
    main()
