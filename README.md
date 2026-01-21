# Info

# File Structure
~~~
aframe-3d-workspace
├── README.md
├── src
└── certificates
~~~

# Setup
## mkcert
~~~
# install mkcert
sudo apt update
sudo apt install mkcert libnss3-tools
mkcert -install

# create CA certificate and key
mkdir certificates
cd certificates
mkcert localhost
~~~
## edit src/components/AframeScene.js
~~~
<RosConnection rosUrl="wss://localhost:9090" rosDomainId="0" setRos={setRos} />
{ros && (
  <LidarData
    ros={ros}
    topicName="/pcl_data"
    messageType="sensor_msgs/msg/PointCloud2"
    throttleMs={33}
    position="0 0 0"
    rotation="-90 0 0"
    maxPoints={100000}
    vertexColors={true}
    pointSize={0.2}
    sizeAttenuation={false}
  />
)}
~~~
- rosUrl
- rosDomainID
- topicName

# Running
## Terminal 1: Start HTTPS Server
- `pnpm i` -> `pnpm run dev-https`
- Access [https://localhost:3000](https://localhost:3000) in your browser
- [WebXR Extension](https://www.crossroad-tech.com/entry/immersive-web-emulator)
## Terminal 2: Start ROS2 --> WebSocket Bridge
- Check `<RosConnection ...\>` in `src/components/AframeScene.js`
    - `rosUrl`: wss://<server IP address>:9090
    - `rosDomainId`: Output of `echo $ROS_DOMAIN_ID` in the terminal
~~~
ros2 launch rosbridge_server rosbridge_websocket_launch.xml \
  ssl:=true \
  certfile:=/<full path to aframe-3d-workspace>/certificates/localhost.pem \
  keyfile:=/<full path to aframe-3d-workspace>/certificates/localhost-key.pem

or

source ros2_websocket.sh
~~~
## Terminal 3: Start Realsense