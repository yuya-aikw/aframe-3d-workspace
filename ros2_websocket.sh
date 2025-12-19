# ros2 launch rosbridge_server rosbridge_websocket_launch.xml
ros2 launch rosbridge_server rosbridge_websocket_launch.xml \
  ssl:=true \
  certfile:=/home/aichi2204/jms2025_demo/certificates/localhost.pem \
  keyfile:=/home/aichi2204/jms2025_demo/certificates/localhost-key.pem