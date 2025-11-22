"use client";
import 'aframe';

import { useEffect, useRef, useState } from "react";
import RosConnection from './ros/RosConnection';
import LidarData from "./ros/LidarData";
import './vehicle/VehicleController';

(function () {
  if (typeof window === "undefined" || !window.AFRAME) return;
  const AFRAME = window.AFRAME;

  AFRAME.registerComponent('refresh-mjpeg', {
    dependencies: ['material'],

    init: function () {
      this.material = null;

      const el = this.el;
      el.addEventListener('materialtextureloaded', () => {
        const mesh = el.getObject3D('mesh');
        if (!mesh) return;
        this.material = mesh.material;
      });
    },

    tick: function () {
      if (!this.material || !this.material.map) return;
      this.material.map.needsUpdate = true;
    }
  });
})();



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
        <a-scene gltf-model="dracoDecoderPath: /draco/"
          embedded
          vr-mode-ui="enabled: false"
          style={{ height: "100vh", width: "100vw" }}
        >
          <a-assets ref={assetsRef}>
            <a-asset-item
              id="assembly"
              src="/YAMAHA_AE88_color_Assembly/YAMAHA_AE88_color_Assembly_flipped.gltf"
            ></a-asset-item>
              <img
              id="servercam"
              src="https://192.168.1.160:5000/video_feed"
              crossOrigin="anonymous"
            />
          </a-assets>



          {areAssetsReady ? (
            <>
              {/* <a-entity id="rig" movement-controls="fly: false;" vehicle-controller>
                <a-entity
                  camera
                  position="0 -1.5 0"
                  look-controls="pointerLockEnabled: false"
                ></a-entity>
                <a-entity oculus-touch-controls="hand: left"></a-entity>
                <a-entity oculus-touch-controls="hand: right"></a-entity>
              </a-entity> */}

              <a-sky color="#FFFFFF"></a-sky>

              <a-plane
                id="ground"
                position="0 0 0"
                rotation="-90 0 90"
                width="10"
                height="10"
                color="#888888"
              ></a-plane>

              <a-plane
                material="src: #servercam"
                width="1.6"
                height="0.9"
                position="0 1 3"
                rotation="0 180 0"
                opacity="0.8"
                refresh-mjpeg
              />
              
              <a-entity id="yamaha_ae88" position="0 0.3003405034542084 -0.3" rotation="0 0 0">
                <a-entity gltf-model="#assembly"></a-entity>
              </a-entity>
            </>
          ) : (
            <a-entity position="0 1.6 -2">
              <a-text value="Loading model..." color="#000"></a-text>
            </a-entity>
          )}

          <RosConnection rosUrl="wss://192.168.1.160:9080" rosDomainId="115" setRos={setRos} />
          {ros &&
            <LidarData ros={ros} position="1 1.304 0.5" rotation="21.386 0 1.818" />
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
