import React, { useEffect, useRef, useState } from 'react';
import RosTopicListener from './RosTopicListener';

// Mid-360 の点群をデコードしてA-frameの単色のPointsとして表示するコンポーネント
// ros2 -> a-frame
// x -> x
// y -> -z
// z -> y

const Message2ThreePointsXYZ = ({ message, position, rotation }) => {
    const entityRef = useRef(null);
    const geometryRef = useRef(null);
    const pointsRef = useRef(null);

    useEffect(() => {
        const el = entityRef.current;

        // A-Frame entity が準備できるまで待機
        if (!el || !el.object3D) {
            return;
        }

        const THREE = (typeof window !== 'undefined' && window.THREE) || (typeof globalThis !== 'undefined' && globalThis.THREE);
        if (!THREE) {
            return;
        }

        if (!message || !message.data || !message.width) {
            // remove existing points if any
            if (pointsRef.current) {
                if (typeof el.removeObject3D === 'function') el.removeObject3D('points');
                else if (el.object3D && pointsRef.current.parent) el.object3D.remove(pointsRef.current);
                if (pointsRef.current.geometry) pointsRef.current.geometry.dispose();
                if (pointsRef.current.material) pointsRef.current.material.dispose();
                pointsRef.current = null;
                geometryRef.current = null;
            }
            return;
        }

        const binaryString = atob(message.data);
        const rows = message.width || 0;
        const stride = message.point_step || 32; // デフォルト32バイト（標準的なPointCloud2）
        const expectedLen = rows * stride;

        // 入力チェック
        if (binaryString.length < expectedLen) {
            return;
        }

        const bytes = new Uint8Array(expectedLen);
        for (let i = 0; i < expectedLen; i++) {
            bytes[i] = binaryString.charCodeAt(i) & 0xff;
        }

        const dataView = new DataView(bytes.buffer);
        const positionArray = new Float32Array(rows * 3);

        // xyz のオフセットを取得（デフォルトは標準的な配置）
        const xOffset = message.fields?.[0]?.offset || 0;
        const yOffset = message.fields?.[1]?.offset || 4;
        const zOffset = message.fields?.[2]?.offset || 8;

        for (let i = 0; i < rows; i++) {
            const base = i * stride;
            // 範囲チェック
            if (base + Math.max(xOffset, yOffset, zOffset) + 4 > bytes.length) {
                console.warn(`Point ${i}: Data access would exceed buffer bounds`);
                break;
            }

            const x = dataView.getFloat32(base + xOffset, true);
            const y = dataView.getFloat32(base + yOffset, true);
            const z = dataView.getFloat32(base + zOffset, true);

            // NaN チェック
            if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(z)) {
                positionArray[i * 3] = 0;
                positionArray[i * 3 + 1] = 0;
                positionArray[i * 3 + 2] = 0;
                continue;
            }

            positionArray[i * 3] = x;
            positionArray[i * 3 + 1] = z;
            positionArray[i * 3 + 2] = -y;
        }

        // create or update geometry
        if (!geometryRef.current) {
            geometryRef.current = new THREE.BufferGeometry();
            const positionAttribute = new THREE.BufferAttribute(positionArray, 3);
            positionAttribute.setUsage(THREE.DynamicDrawUsage);
            geometryRef.current.setAttribute('position', positionAttribute);
        } else {
            const attr = geometryRef.current.getAttribute('position');
            if (!attr || attr.array.length !== positionArray.length) {
                geometryRef.current.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));
            } else {
                attr.array.set(positionArray);
                attr.needsUpdate = true;
            }
        }

        // create or update Points and attach to A-Frame entity
        if (!pointsRef.current) {
            const material = new THREE.PointsMaterial({
                color: 0x00ff00,
                size: 0.015,
                sizeAttenuation: true,
            });
            pointsRef.current = new THREE.Points(geometryRef.current, material);
            if (typeof el.setObject3D === 'function') {
                el.setObject3D('points', pointsRef.current);
            } else if (el.object3D) {
                el.object3D.add(pointsRef.current);
            }
        } else {
            pointsRef.current.geometry = geometryRef.current;
        }
    }, [message, position, rotation]);

    // cleanup on unmount
    useEffect(() => () => {
        const el = entityRef.current;
        if (!el) return;
        if (pointsRef.current) {
            if (typeof el.removeObject3D === 'function') el.removeObject3D('points');
            else if (el.object3D && pointsRef.current.parent) el.object3D.remove(pointsRef.current);
            if (pointsRef.current.geometry) pointsRef.current.geometry.dispose();
            if (pointsRef.current.material) pointsRef.current.material.dispose();
            pointsRef.current = null;
        }
        geometryRef.current = null;
    }, []);

    return <a-entity ref={entityRef} position={position} rotation={rotation} />;
};

const LidarData = ({
    ros,
    topicName = '/livox/lidar',
    messageType = 'sensor_msgs/msg/PointCloud2',
    throttleMs = 100, //100ms,10Hz でa-frame更新
    position = '0 0 0',
    rotation = '0 0 0',
}) => {
    const [message, setMessage] = useState(null);
    const [sceneReady, setSceneReady] = useState(false);
    const listenerRef = useRef(null);

    // A-Frame シーンの初期化を待つ
    useEffect(() => {
        const checkScene = () => {
            const scene = document.querySelector('a-scene');
            if (scene?.hasLoaded) {
                setSceneReady(true);
            } else if (scene) {
                scene.addEventListener('loaded', () => setSceneReady(true), { once: true });
            } else {
                // シーンがまだDOMに存在しない場合は再試行
                setTimeout(checkScene, 100);
            }
        };
        checkScene();
    }, []);

    return (
        <>
            <RosTopicListener
                ref={listenerRef}
                ros={ros}
                topicName={topicName}
                messageType={messageType}
                onMessage={setMessage}
                throttleMs={throttleMs}
            />
            {sceneReady && (
                <Message2ThreePointsXYZ message={message} position={position} rotation={rotation} />
            )}
        </>
    );
};

export default LidarData;