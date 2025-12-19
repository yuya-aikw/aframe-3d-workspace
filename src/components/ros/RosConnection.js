import React, { useEffect, useRef } from 'react';
import ROSLIB from 'roslib';

const RosConnection = ({ rosUrl, rosDomainId, setRos }) => {
  const rosRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const shouldReconnectRef = useRef(true);

  useEffect(() => {
    shouldReconnectRef.current = true;
    
    const connect = () => {
      // Clean up existing connection without triggering reconnect
      if (rosRef.current) {
        try {
          // Remove all event listeners before closing
          rosRef.current.removeAllListeners();
          rosRef.current.close();
        } catch (e) {
          console.warn('Error closing previous ROS connection:', e);
        }
      }

      const ros = new ROSLIB.Ros({
        url: rosUrl,
        options: {
          ros_domain_id: rosDomainId
        }
      });

      rosRef.current = ros;

      ros.on("connection", () => {
        setRos(ros);
        console.log('Connected to ROSBridge WebSocket server.');
      });

      ros.on('error', function (error) {
        console.log('Error connecting to ROSBridge WebSocket server: ', error);
        setRos(null);
      });

      ros.on('close', function () {
        console.log('Closed connection to ROSBridge WebSocket server.');
        setRos(null);

        // Only reconnect if this is an unexpected disconnection
        if (shouldReconnectRef.current) {
          console.log('Attempting reconnect in 2s...');
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Reconnecting to ROSBridge...');
            connect();
          }, 2000);
        }
      });
    };

    connect();

    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (rosRef.current) {
        try {
          rosRef.current.removeAllListeners();
          rosRef.current.close();
        } catch (e) {
          console.warn('Error closing ROS connection on cleanup:', e);
        }
      }
    };
  }, [rosUrl, rosDomainId, setRos]);

  return (
    <>
    </>
  );
}
export default RosConnection;