import React, { useState, useRef, useEffect } from 'react';
import RosTopicListener from './RosTopicListener';

const Message2ACylinders = ({ message }) => {
    // x, y, z, radius, height の順でデータが格納されていると仮定
    if (!message || !message.data || message.data.length === 0) {
        return null;
    }

    const a = message.data;
    const numCylinders = Math.floor(a.length / 5);
    const cylinders = [];

    for (let i = 0; i < numCylinders; i++) {
        const baseIndex = i * 5;
        const position = `${a[baseIndex + 0]} ${a[baseIndex + 1]} ${a[baseIndex + 2]}`;
        const radius = a[baseIndex + 3];
        const height = a[baseIndex + 4];

        cylinders.push(
            <a-cylinder
                key={i}
                position={position}
                radius={radius}
                height={height}
                color="#FF0000"
                // material="wireframe: true"
                material="opacity: 0.5; transparent: true"
                segments-height="1"
                segments-radial="8"
            >
            </a-cylinder>
        );
    }
    return <>{cylinders}</>;
};

const MarkerData = ({
    ros,
    topicName = '/markers_pedestrian',
    messageType = 'std_msgs/msg/Float32MultiArray',
    throttleMs = 200, //200ms,5Hz でa-frame更新
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
                <Message2ACylinders
                    message={message}
                />
            )}
        </>
    );
}

export default MarkerData;