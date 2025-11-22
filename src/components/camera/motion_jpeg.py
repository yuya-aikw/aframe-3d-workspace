from flask import Flask, Response
import cv2
from flask_cors import CORS
from ultralytics import YOLO
import time
import threading

app = Flask(__name__)
CORS(app) 
PORT = 5000

"""
sudo apt install v4l-utils
v4l2-ctl -d /dev/video0 --list-formats-ext
使えるフォーマットを確認すること

"""
WIDTH = 1920
HEIGHT = 1080
FPS = 15


def create_capture():
    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, WIDTH)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, HEIGHT)
    cap.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc('M', 'J', 'P', 'G'))
    cap.set(cv2.CAP_PROP_FPS, FPS)
    actual_w = cap.get(cv2.CAP_PROP_FRAME_WIDTH)
    actual_h = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
    actual_fps = cap.get(cv2.CAP_PROP_FPS)
    print(f"設定解像度: {actual_w} x {actual_h}, FPS: {actual_fps}")
    return cap


video = create_capture()

model = YOLO('./yolo11n.pt')

latest_frame = None
frame_lock = threading.Lock()


def process_with_yolo(frame):
    resized = cv2.resize(frame, None, fx=0.5, fy=0.5)
    results = model.predict(
        resized,
        classes=0,
        verbose=False,
        imgsz=320,
        conf=0.5,
        iou=0.7,
    )
    return results[0].plot()


def capture_loop():
    global video, latest_frame
    while True:
        if not video.isOpened():
            video.release()
            video = create_capture()
            time.sleep(0.2)
            continue

        success, frame = video.read()
        if not success:
            video.release()
            video = create_capture()
            time.sleep(0.2)
            continue

        try:
            processed = process_with_yolo(frame)
        except Exception as exc:
            print(f"YOLO処理でエラー: {exc}")
            time.sleep(0.05)
            continue

        with frame_lock:
            latest_frame = processed


threading.Thread(target=capture_loop, daemon=True).start()


def gen_frames():
    while True:
        with frame_lock:
            frame = None if latest_frame is None else latest_frame.copy()

        if frame is None:
            time.sleep(0.01)
            continue

        ret, buffer = cv2.imencode('.jpg', frame)
        if not ret:
            time.sleep(0.01)
            continue

        chunk = buffer.tobytes()
        yield (
            b'--frame\r\n'
            b'Content-Type: image/jpeg\r\n\r\n' + chunk + b'\r\n'
        )
    
@app.route('/video_feed')
def video_feed():
    return Response(gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    context = (
        '/home/ucluser/workspace/uclab/2025/jms2025_demo/certificates/192.168.1.160+3.pem',    # 証明書 (cert)
        '/home/ucluser/workspace/uclab/2025/jms2025_demo/certificates/192.168.1.160+3-key.pem' # 秘密鍵 (key)
    )
    app.run(
        host='0.0.0.0', 
        port=PORT, 
        ssl_context=context
    )
