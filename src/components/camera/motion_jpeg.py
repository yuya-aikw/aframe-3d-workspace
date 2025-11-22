from flask import Flask, Response
import cv2
from flask_cors import CORS
from ultralytics import YOLO
import time

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

video = cv2.VideoCapture(0)
video.set(cv2.CAP_PROP_FRAME_WIDTH, WIDTH)
video.set(cv2.CAP_PROP_FRAME_HEIGHT, HEIGHT)
video.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc('M', 'J', 'P', 'G'))
video.set(cv2.CAP_PROP_FPS, FPS) 
actual_w = video.get(cv2.CAP_PROP_FRAME_WIDTH)
actual_h = video.get(cv2.CAP_PROP_FRAME_HEIGHT)
actual_fps = video.get(cv2.CAP_PROP_FPS)
print(f"設定解像度: {actual_w} x {actual_h}, FPS: {actual_fps}")

model = YOLO('./yolo11n.pt')

def gen_frames():
    while True:
        success, frame = video.read()
        if not success:
            break
        
        # yolo
        frame = cv2.resize(frame, None,fx=0.5,fy=0.5)
        results = model.predict(frame, classes=0, verbose=False,
                                imgsz=320,
                                conf=0.5,
                                iou=0.7,)
        frame = results[0].plot()
        
        # streaming
        ret, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()
        yield (b'--frame\r\n'
                b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
    
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