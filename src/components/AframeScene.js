"use client";
import 'aframe';

import { useEffect, useState } from "react";
import RosConnection from './ros/RosConnection';
import LidarData from "./ros/LidarDataXYZRGB";

export default function AframeScene() {
  const [isAframeReady, setIsAframeReady] = useState(false);
  const [ros, setRos] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.AFRAME) {
      setIsAframeReady(true);
    }
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-white text-black">
      {isAframeReady ? (
        <>
          <a-scene
            embedded
            vr-mode-ui="enabled: false"
            renderer="antialias: true"
            style={{ height: "100vh", width: "100vw" }}
          >
            <a-entity light="type: ambient; intensity: 0.6"></a-entity>
            <a-entity light="type: directional; intensity: 0.8" position="1 2 1"></a-entity>

            {/* Free-fly camera (allows vertical movement) */}
            <a-entity id="cameraRig" movement-controls="fly: true" position="0 1.6 4">
              <a-entity camera look-controls wasd-controls="fly: true"></a-entity>
            </a-entity>

            <RosConnection rosUrl="wss://localhost:9090" rosDomainId="114" setRos={setRos} />
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
          </a-scene>
        </>
      ) : (
        <div className="flex h-full items-center justify-center">
          Loading A-Frame...
        </div>
      )}
    </div>
  );
}
