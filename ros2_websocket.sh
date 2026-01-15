ros2 launch rosbridge_server rosbridge_websocket_launch.xml \
  ssl:=true \
  certfile:=$PWD/certificates/localhost.pem \
  keyfile:=$PWD/certificates/localhost-key.pem