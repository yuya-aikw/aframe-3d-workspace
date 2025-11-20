# Info
[Japan Mobility Show Nagoya 2025 (2025/11/22~2025/11/24)](https://www.japan-mobility-show.com/) のWebXR実装

# File Structure
- [作っていただいた車体のモデル](https://nucl.slack.com/archives/C09LP0QSBM3/p1761111898226899?thread_ts=1760572530.666869&cid=C09LP0QSBM3)を展開
~~~
jms2025_demo
├── README.md
├── src
└── public
    └── modelのファイル
~~~

# Running
## ターミナル1: httpsサーバーの起動
- `pnpm i` -> `pnpm run dev-https`
- ブラウザで[http://localhost:3000](http://localhost:3000)にアクセス
- [WebXRの拡張機能](https://www.crossroad-tech.com/entry/immersive-web-emulator)
## ターミナル2: ROS2 --> WebSocket のブリッジの起動
- `src/components/AframeScene.js` の `<RosConnection ...\>` を確認
    - `rosUrl`: wss://<サーバーのIPアドレス>:9090
    - `rosDomainId`: ターミナルでの`echo $ROS_DOMAIN_ID`の出力
- ~~~
    ros2 launch rosbridge_server rosbridge_websocket_launch.xml \
    ssl:=true \
    certfile:=/<jms2025_demo へのフルパス>/certificates/localhost.pem \
    keyfile:=/<jms2025_demo へのフルパス>/certificates/localhost-key.pem
  ~~~
## ターミナル3: Livox Mid-360 の起動
- lidarに電源を接続
- lidarに生えているlanケーブルをPCに接続し，`Setting` -> `Network` で`livox_mid360`を選択
- `ros2 launch livox_ros_driver2 rviz_MID360_launch.py`
- rviz2の画面で点群が見えていることを確認したら画面を消してOK
## ターミナル4: USBカメラの起動
- `cd src/components/camera/motion_jpeg.py`
- `source venv/bin/activate`
- (venv)`python motion_jpeg.py`
- 縦，横，レートを調整する