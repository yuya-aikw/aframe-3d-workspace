"use client";

import { useEffect, useRef, useState } from "react";
import RosConnection from './ros/RosConnection';
import LidarData from "./ros/LidarData";
import MarkerData from "./ros/MarkerData";
import { processMapObjects } from './map/MapObjects';
import './vehicle/VehicleController';

(function () {
  if (typeof window === "undefined" || !window.AFRAME) return;
  const AFRAME = window.AFRAME;
  /**
   * 'refresh-mjpeg' コンポーネント
   * MJPEGストリームをソースとするマテリアルのテクスチャを
   * 毎フレーム強制的に更新します。
   */
  AFRAME.registerComponent('refresh-mjpeg', {
    // 依存関係: materialコンポーネントが先に読み込まれるのを待つ
    dependencies: ['material'],

    init: function () {
      // el は、このコンポーネントがアタッチされた要素 (<a-plane>)
      const el = this.el;

      // テクスチャが最初に読み込まれた（静止画が表示された）タイミングで実行
      el.addEventListener('materialtextureloaded', () => {
        const material = el.getObject3D('mesh').material;
        if (!material.map) {
          // マップ(テクスチャ)がなければ何もしない
          return;
        }
        // A-Frameの毎フレーム更新ループ(tick)に関数を登録
        this.tick = function () {
          material.map.needsUpdate = true;
        }
      });
    }
  });
})();

export default function AframeScene() {
  const [isAframeReady, setIsAframeReady] = useState(false);
  const [areAssetsReady, setAreAssetsReady] = useState(false);
  const [ros, setRos] = useState(null);
  const assetsRef = useRef(null);
  const { assets: mapAssets, entities: mapEntities } = processMapObjects();

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
          gltf-model="dracoDecoderPath: https://www.gstatic.com/draco/v1/decoders/"
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
            {mapAssets}
          </a-assets>

          {areAssetsReady ? (
            <>
              {/* <a-entity id="rig" movement-controls="fly: false;" vehicle-controller>
                <a-entity
                  camera
                  position="0 1.2 0"
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

              {mapEntities}

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

          <RosConnection rosUrl="wss://localhost:9090" rosDomainId="114" setRos={setRos} />
          {ros &&
            <>
              <LidarData ros={ros} position="0 1 0" rotation="0 0 0" />
              {/* <MarkerData ros={ros} /> */}
            </>
          }

          <a-assets>
            <img
              id="servercam"
              src="https://localhost:5000/video_feed"
              crossOrigin="anonymous"
              style={{ display: 'none' }} />
          </a-assets>
          <a-plane id="window" geometry="primitive: plane; width: 2; height: 1.5" material="src: #servercam"
            position="0 1.5 -3" refresh-mjpeg>
          </a-plane>

        </a-scene>
      ) : (
        <div className="flex h-full items-center justify-center">
          Loading A-Frame...
        </div>
      )}
    </div>
  );
}
