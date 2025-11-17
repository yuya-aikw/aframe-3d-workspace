"use client";

import { useEffect, useRef, useState } from "react";
import RosConnection from './ros/RosConnection';
import LidarData from "./ros/LidarData";
import './vehicle/VehicleController';

export default function AframeScene() {
  const [isAframeReady, setIsAframeReady] = useState(false);
  const [areAssetsReady, setAreAssetsReady] = useState(false);
  const [ros, setRos] = useState(null);
  const assetsRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.AFRAME) {
      setIsAframeReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isAframeReady) return;
    const el = assetsRef.current;
    if (el) {
      const handler = () => setAreAssetsReady(true);
      el.addEventListener("loaded", handler);
      return () => el.removeEventListener("loaded", handler);
    }
  }, [isAframeReady]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-white text-black">
      {isAframeReady ? (
        <a-scene
          embedded
          vr-mode-ui="enabled: false"
          style={{ height: "100vh", width: "100vw" }}
          gltf-model="https://www.gstatic.com/draco/v1/decoders/" // src="/yamaha_ae88_draco/... : compressed model,  src="/yamaha_ae88/... : original model
        >
          <a-assets ref={assetsRef}>
            <a-asset-item
              id="body"
              src="/yamaha_ae88_draco/yamaha_ae88_body.gltf"
            ></a-asset-item>
            <a-asset-item
              id="roof"
              src="/yamaha_ae88_draco/yamaha_ae88_roof.gltf"
            ></a-asset-item>
            <a-asset-item
              id="frame1"
              src="/yamaha_ae88_draco/yamaha_ae88_frame1.gltf"
            ></a-asset-item>
            <a-asset-item
              id="frame2"
              src="/yamaha_ae88_draco/yamaha_ae88_frame2.gltf"
            ></a-asset-item>
            <a-asset-item
              id="frameR"
              src="/yamaha_ae88_draco/yamaha_ae88_frameR.gltf"
            ></a-asset-item>
            <a-asset-item
              id="frameF"
              src="/yamaha_ae88_draco/yamaha_ae88_frameF.gltf"
            ></a-asset-item>
            <a-asset-item
              id="TireFL"
              src="/yamaha_ae88_draco/yamaha_ae88_TireFL.gltf"
            ></a-asset-item>
            <a-asset-item
              id="TireFR"
              src="/yamaha_ae88_draco/yamaha_ae88_TireFR.gltf"
            ></a-asset-item>
            <a-asset-item
              id="TireRL"
              src="/yamaha_ae88_draco/yamaha_ae88_TireRL.gltf"
            ></a-asset-item>
            <a-asset-item
              id="TireRR"
              src="/yamaha_ae88_draco/yamaha_ae88_TireRR.gltf"
            ></a-asset-item>
          </a-assets>

          {areAssetsReady ? (
            <>
              <a-entity id="rig" movement-controls="fly: false;" vehicle-controller>
                <a-entity
                  camera
                  position="0 1.2 0"
                  look-controls="pointerLockEnabled: false"
                ></a-entity>
                <a-entity oculus-touch-controls="hand: left"></a-entity>
                <a-entity oculus-touch-controls="hand: right"></a-entity>
              </a-entity>

              <a-sky color="#FFFFFF"></a-sky>

              <a-plane
                id="ground"
                position="0 0 0"
                rotation="-90 0 90"
                width="10"
                height="10"
                color="#888888"
              ></a-plane>

              <a-entity id="yamaha_ae88" position="0 1 0" rotation="0 0 0">
                <a-entity gltf-model="#body"></a-entity>
                <a-entity gltf-model="#roof"></a-entity>
                <a-entity gltf-model="#frame1"></a-entity>
                <a-entity gltf-model="#frame2"></a-entity>
                <a-entity gltf-model="#frameR"></a-entity>
                <a-entity gltf-model="#frameF"></a-entity>
                <a-entity gltf-model="#TireFL"></a-entity>
                <a-entity gltf-model="#TireFR"></a-entity>
                <a-entity gltf-model="#TireRL"></a-entity>
                <a-entity gltf-model="#TireRR"></a-entity>
              </a-entity>
            </>
          ) : (
            <a-entity position="0 1.6 -2">
              <a-text value="Loading model..." color="#000"></a-text>
            </a-entity>
          )}

          <RosConnection rosUrl="wss://localhost:9090" rosDomainId="0" setRos={setRos} />
          {ros &&
            <LidarData ros={ros} position="0 1 0" rotation="0 0 0"/>
          }
          
        </a-scene>
      ) : (
        <div className="flex h-full items-center justify-center">
          Loading A-Frame...
        </div>
      )}
    </div>
  );
}
