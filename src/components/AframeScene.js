'use client';

import { useEffect, useState } from "react";
import Script from "next/script";

export default function AframeScene() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (window.AFRAME) {
      setIsReady(true);
    }
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-white text-black">
      <Script
        src="https://aframe.io/releases/1.5.0/aframe.min.js"
        strategy="afterInteractive"
        onLoad={() => setIsReady(true)}
      />
      <Script
        src="https://cdn.jsdelivr.net/gh/c-frame/aframe-extras@7.2.0/dist/aframe-extras.min.js"
        strategy="afterInteractive"
      />

      {isReady ? (
        <a-scene embedded vr-mode-ui="enabled: false" style={{ height: "100vh", width: "100vw" }}>
          <a-entity id="rig" movement-controls="fly: true;">
            <a-entity camera position="0 1.6 0" look-controls="pointerLockEnabled: false"></a-entity>
            <a-entity oculus-touch-controls="hand: left"></a-entity>
            <a-entity oculus-touch-controls="hand: right"></a-entity>
          </a-entity>

          <a-sky color="#FFFFFF"></a-sky>

          <a-plane id="ground" position="0 0 0" rotation="-90 0 0" width="10" height="10" color="#888888"></a-plane>

          <a-box position="-1 0.5 -3" rotation="0 45 0" color="#4CC3D9" shadow></a-box>
          <a-sphere position="0 1.25 -5" radius="1.25" color="#FFC65D" shadow></a-sphere>
          <a-cylinder position="1 0.75 -3" radius="0.5" height="1.5" color="#EF2D5E" shadow></a-cylinder>

          <a-entity id="yamaha_ae88" position="0 1 0" rotation="0 0 0">
            <a-entity gltf-model="#body">
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
          </a-entity>

          <a-assets>
            <a-asset-item id="body" src="/yamaha_ae88/yamaha_ae88_body.gltf"></a-asset-item>
            <a-asset-item id="roof" src="/yamaha_ae88/yamaha_ae88_roof.gltf"></a-asset-item>
            <a-asset-item id="frame1" src="/yamaha_ae88/yamaha_ae88_frame1.gltf"></a-asset-item>
            <a-asset-item id="frame2" src="/yamaha_ae88/yamaha_ae88_frame2.gltf"></a-asset-item>
            <a-asset-item id="frameR" src="/yamaha_ae88/yamaha_ae88_frameR.gltf"></a-asset-item>
            <a-asset-item id="frameF" src="/yamaha_ae88/yamaha_ae88_frameF.gltf"></a-asset-item>
            <a-asset-item id="TireFL" src="/yamaha_ae88/yamaha_ae88_TireFL.gltf"></a-asset-item>
            <a-asset-item id="TireFR" src="/yamaha_ae88/yamaha_ae88_TireFR.gltf"></a-asset-item>
            <a-asset-item id="TireRL" src="/yamaha_ae88/yamaha_ae88_TireRL.gltf"></a-asset-item>
            <a-asset-item id="TireRR" src="/yamaha_ae88/yamaha_ae88_TireRR.gltf"></a-asset-item>
          </a-assets>
        </a-scene>
      ) : (
        <div className="flex h-full items-center justify-center">Loading A-Frame...</div>
      )}
    </div>
  );
}
