from flask import Flask, Response
import cv2
from flask_cors import CORS
from ultralytics import YOLO
import pyrealsense2 as rs
import numpy as np

app = Flask(__name__)
CORS(app) 
video = cv2.VideoCapture(2)

model = YOLO('./yolo11n.pt')

PORT = 5000

# ストリームの設定
pipeline = rs.pipeline()
config = rs.config()

# カラーストリームを設定
config.enable_stream(rs.stream.color, 640, 480, rs.format.bgr8, 30)

# デプスストリームを設定
config.enable_stream(rs.stream.depth, 640, 480, rs.format.z16, 30)

# ストリーミング開始
pipeline.start(config)


def gen_frames():
    print(config)
    try:
        while True:
            # フレームセットを待機
            frames = pipeline.wait_for_frames()
            # カラーフレームとデプスフレームを取得
            frame = np.asanyarray(frames.get_color_frame().get_data())
            frame_d = np.asanyarray(frames.get_depth_frame().get_data())
            
            # yolo
            # frame = cv2.resize(frame, (640, 480))
            
            results = model.predict(frame, classes=0, verbose=False, imgsz=320)
            # frame = yolo_draw(results,frame)
            frame = results[0].plot()
            
            # streaming
            ret, buffer = cv2.imencode('.jpg', frame)
            frame = buffer.tobytes()
            yield (b'--frame\r\n'
                    b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
    finally:
        # ストリーミング停止
        pipeline.stop()

def yolo_draw(results, frame):
    for box in results[0].boxes:
        # BBoxの座標 (xyxy形式: [x1, y1, x2, y2])
        # .cpu()と.numpy()でGPU/TensorからCPU/Numpy配列に変換します
        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(int)
        # 信頼度 (Confidence)
        conf = box.conf[0].cpu().numpy()
        # クラスID (今回は 0 のはず)
        cls_id = int(box.cls[0].cpu().numpy())
        class_name = model.names[cls_id] # 'person'
        # (デバッグ用) 取得した情報でBBoxとラベルを描画
        label = f"{conf:.2f}"
        # BBoxを描画
        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
        # ラベル（クラス名と信頼度）を描画
        cv2.putText(frame, label, (x1, y1 - 10), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
    return frame
    
@app.route('/video_feed')
def video_feed():
    return Response(gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    context = (
        '../../../certificates/localhost.pem',    # 証明書 (cert)
        '../../../certificates/localhost-key.pem' # 秘密鍵 (key)
    )
    app.run(
        host='0.0.0.0', 
        port=PORT, 
        ssl_context=context
    )