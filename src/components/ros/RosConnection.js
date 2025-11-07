import React, { useEffect } from 'react';
import ROSLIB from 'roslib';

const RosConnection = ({ rosUrl, rosDomainId, setRos}) => {

  useEffect(() => {
    const ros = new ROSLIB.Ros({
      url: rosUrl,
      options: {
        ros_domain_id: rosDomainId // ROS_DOMAIN_IDを設定する
      }
    });

    ros.on("connection", () => {
      setRos(ros);
      // document.getElementById("status").innerHTML = "successful";
      console.log('Connected to ROSBridge WebSocket server.');
    });
  
    ros.on('error', function(error) {
      console.log('Error connecting to ROSBridge WebSocket server: ', error);
    });
  
    ros.on('close', function() {
      console.log('Connection to ROSBridge WebSocket server closed.');
    });

    return () => {
      ros.close();
    };
  }, [rosUrl, rosDomainId, setRos]);

  return (
    <>
    </>
  );
}
export default RosConnection;