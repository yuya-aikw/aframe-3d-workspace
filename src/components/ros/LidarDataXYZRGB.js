// ros2 -> a-frame
// x -> x
// y -> -z
// z -> y

import React, { useState, useRef, useEffect } from 'react';
import RosTopicListener from './RosTopicListener';

// PointField datatype to size and reader mapping (https://docs.ros.org/en/noetic/api/sensor_msgs/html/msg/PointField.html)
const POINT_FIELD_TYPE_INFO = {
    1: { size: 1, reader: (dv, o) => dv.getInt8(o) },
    2: { size: 1, reader: (dv, o) => dv.getUint8(o) },
    3: { size: 2, reader: (dv, o, le) => dv.getInt16(o, le) },
    4: { size: 2, reader: (dv, o, le) => dv.getUint16(o, le) },
    5: { size: 4, reader: (dv, o, le) => dv.getInt32(o, le) },
    6: { size: 4, reader: (dv, o, le) => dv.getUint32(o, le) },
    7: { size: 4, reader: (dv, o, le) => dv.getFloat32(o, le) },
    8: { size: 8, reader: (dv, o, le) => dv.getFloat64(o, le) },
};

// change for each lidar data point !!!!!!!!!!!!!!!!!
function processPoint({
    dataView,
    base,
    fields,
    fieldReaders,
    isBigEndian,
    positionArray,
    colorArray,
    pointIndex,
}) {
    // for Realsense point cloud
    const le = !isBigEndian;
    const x = fieldReaders[0].reader(dataView, base + fields[0].offset, le);
    const y = fieldReaders[1].reader(dataView, base + fields[1].offset, le);
    const z = fieldReaders[2].reader(dataView, base + fields[2].offset, le);
    positionArray[pointIndex * 3 + 0] = x;
    positionArray[pointIndex * 3 + 1] = z; // y -> -z
    positionArray[pointIndex * 3 + 2] = -y; // z -> y

    const rgbUint = dataView.getUint32(base + fields[3].offset, le);
    const r = (rgbUint >> 16) & 0xff;
    const g = (rgbUint >> 8) & 0xff;
    const b = rgbUint & 0xff;
    colorArray[pointIndex * 3 + 0] = r;
    colorArray[pointIndex * 3 + 1] = g;
    colorArray[pointIndex * 3 + 2] = b;
}

const decodePointCloudAttributes = (msg, positionArrayIn, colorArrayIn, cachedFields, cachedFieldReaders, maxPoints) => {
    const startTime = performance.now();
    
    const frameId = msg?.header?.frame_id || '';
    const timestampSec = msg?.header?.stamp?.sec || 0;
    const timestampNanosec = msg?.header?.stamp?.nanosec || 0;
    const height = msg?.height || 0;
    const width = msg?.width || 0;
    const isBigEndian = msg?.is_bigendian || false;
    const pointStep = msg?.point_step || 0;
    const rowStep = msg?.row_step || 0;
    const isDense = msg?.is_dense || true;

    const totalPoints = width * height;

    if (!positionArrayIn || !colorArrayIn) {
        console.warn('[Decode] No input arrays provided');
        return false;
    }

    if (totalPoints > maxPoints) {
        console.warn(`[Decode] Points ${totalPoints} exceeds maxPoints ${maxPoints}, will truncate`);
    }

    const decodeStart = performance.now();
    const data_binary = atob(msg.data);
    
    const bytes = new Uint8Array(data_binary.length);
    for (let i = 0; i < data_binary.length; i++) {
        bytes[i] = data_binary.charCodeAt(i) & 0xff;
    }

    const dataView = new DataView(bytes.buffer);
    const pointCount = Math.min(totalPoints, maxPoints);

    const processStart = performance.now();
    
    for (let i = 0; i < pointCount; i++) {
        const base = i * pointStep;
        processPoint({
            dataView,
            base,
            fields: cachedFields,
            fieldReaders: cachedFieldReaders,
            isBigEndian,
            positionArray: positionArrayIn,
            colorArray: colorArrayIn,
            pointIndex: i,
        });
    }
    
    const processTime = performance.now() - processStart;
    const totalTime = performance.now() - startTime;
    
    console.log(`[Decode] Point Num: ${pointCount}, Point processing: ${processTime.toFixed(1)}[ms], Total decode time: ${totalTime.toFixed(1)}[ms]`);


    return true;
};

const MessageToThreePoints = ({ message, position, rotation, maxPoints, vertexColors, pointSize, sizeAttenuation}) => {
    const entityRef = useRef(null);
    const geometryRef = useRef(null);
    const pointsRef = useRef(null);
    const cachedFieldsRef = useRef(null);
    const cachedFieldReadersRef = useRef(null);

    useEffect(() => {
        const msg = message;
        const el = entityRef.current;

        // Is THREE available?
        if (!el || !el.object3D) {
            console.warn("MessageToThreePoints: A-Frame entity or object3D not available yet.");
            return;
        }
        const THREE = (typeof window !== 'undefined' && window.THREE) || (typeof globalThis !== 'undefined' && globalThis.THREE);
        if (!THREE) {
            console.warn("MessageToThreePoints: THREE.js not available.");
            return;
        }

        // If no valid message, remove existing points
        if (!msg || !msg.data || !msg.width) {
            console.log("MessageToThreePoints: no valid message, removing existing points if any.");
            if (pointsRef.current) {
                console.log("MessageToThreePoints: removing points from scene.");
                if (typeof el.removeObject3D === 'function') el.removeObject3D('points');
                else if (el.object3D && pointsRef.current.parent) el.object3D.remove(pointsRef.current);
                if (pointsRef.current.geometry) pointsRef.current.geometry.dispose();
                if (pointsRef.current.material) pointsRef.current.material.dispose();
                pointsRef.current = null;
                geometryRef.current = null;
            }
            return;
        }

        const pointCount = (msg.width || 0) * (msg.height || 0);
        const targetAllocLen = maxPoints * 3;

        if (pointCount > maxPoints) {
            console.warn(`LidarDataRealSense: pointCount (${pointCount}) exceeds maxPoints (${maxPoints}). Points will be truncated.`);
        }

        // parse fields on first message only
        if (!cachedFieldsRef.current && msg.fields) {
            cachedFieldsRef.current = (msg.fields || []).map((f) => ({
                name: f?.name || '',
                offset: f?.offset || 0,
                datatype: f?.datatype || 0,
                count: f?.count || 0,
            }));
            cachedFieldReadersRef.current = cachedFieldsRef.current.map((f) => POINT_FIELD_TYPE_INFO[f.datatype]);
        }

        // create BufferGeometry if not yet created
        if (!geometryRef.current) {
            geometryRef.current = new THREE.BufferGeometry();
            const positionArray = new Float32Array(targetAllocLen);
            const colorArray = new Uint8Array(targetAllocLen);

            const positionAttribute = new THREE.BufferAttribute(positionArray, 3);
            positionAttribute.setUsage(THREE.DynamicDrawUsage);
            geometryRef.current.setAttribute('position', positionAttribute);

            const colorAttribute = new THREE.BufferAttribute(colorArray, 3, true);
            colorAttribute.setUsage(THREE.DynamicDrawUsage);
            geometryRef.current.setAttribute('color', colorAttribute);
        }

        // decode point cloud data into BufferGeometry attributes
        const attrPos = geometryRef.current.getAttribute('position');
        const attrCol = geometryRef.current.getAttribute('color');
        const positionArray = attrPos.array;
        const colorArray = attrCol.array;

        const updated = decodePointCloudAttributes(msg, positionArray, colorArray, cachedFieldsRef.current, cachedFieldReadersRef.current, maxPoints);
        if (!updated) return;

        // update needsUpdate flags
        attrPos.needsUpdate = true;
        attrCol.needsUpdate = true;

        // set draw range
        geometryRef.current.setDrawRange(0, Math.min(pointCount, maxPoints));

        // create or update Points and attach to A-Frame entity
        if (!pointsRef.current) {
            const material = new THREE.PointsMaterial({
                vertexColors: vertexColors,
                size: pointSize,
                sizeAttenuation: sizeAttenuation
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
    }, [message, position, rotation, maxPoints]);

    // update material properties when they change
    useEffect(() => {
        if (pointsRef.current && pointsRef.current.material) {
            pointsRef.current.material.vertexColors = vertexColors;
            pointsRef.current.material.size = pointSize;
            pointsRef.current.material.sizeAttenuation = sizeAttenuation;
            pointsRef.current.material.needsUpdate = true;
        }
    }, [vertexColors, pointSize, sizeAttenuation]);

    // cleanup on unmount
    useEffect(() => {
        return () => {
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
        };
    }, []);

    return <a-entity ref={entityRef} position={position} rotation={rotation} />;
};

const LidarData = ({
    ros,
    topicName,
    messageType = "sensor_msgs/msg/PointCloud2",
    throttleMs, // 33ms ~= 30Hz (200 -> 5Hz)
    position = "0 0 0",
    rotation = "0 0 0",
    maxPoints,
    vertexColors = true,
    pointSize,
    sizeAttenuation = true
}) => {
    const [message, setMessage] = useState(null);
    const [sceneReady, setSceneReady] = useState(false);
    const listenerRef = useRef(null);

    // wait for a-scene to be loaded
    useEffect(() => {
        console.log("LidarData: waiting for a-scene to load...");
        const checkScene = () => {
            const scene = document.querySelector('a-scene');
            if (scene?.hasLoaded) {
                console.log("LidarData: a-scene loaded.");
                setSceneReady(true);
            } else if (scene) {
                console.log("LidarData: a-scene found, waiting for 'loaded' event...");
                scene.addEventListener('loaded', () => setSceneReady(true), { once: true });
            } else {
                console.log("LidarData: a-scene not found yet.");
                // retry if the scene is not yet in the DOM
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
                <MessageToThreePoints
                    message={message}
                    position={position}
                    rotation={rotation}
                    maxPoints={maxPoints}
                    vertexColors={vertexColors}
                    pointSize={pointSize}
                    sizeAttenuation={sizeAttenuation}
                />
            )}
        </>
    );
}

export default LidarData;