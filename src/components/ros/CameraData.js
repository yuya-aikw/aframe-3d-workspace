import React, { useState, useRef, useMemo } from 'react';
import RosTopicListener from './RosTopicListener';

// CameraData composes a topic listener and an image renderer.
// The listener subscribes to a ROS image topic and passes raw messages;
// the renderer decodes those messages into an <img>.
const CameraData = ({
  ros,
  topicName = '/image_raw/compressed',
  messageType = 'sensor_msgs/CompressedImage',
  imgClassName = 'hoge',
  imgStyle,
  throttleMs = 0,
}) => {
  const [imgMessage, setImgMessage] = useState(null);
  const listenerRef = useRef(null);

  return (
    <>
      <RosTopicListener
        ref={listenerRef}
        ros={ros}
        topicName={topicName}
        messageType={messageType}
        onMessage={setImgMessage}
        throttleMs={throttleMs}
      />

      {/* Inlined CameraImageRenderer (originally in CameraImageRenderer.js) */}
      {(() => {
        const CameraImageRenderer = ({ message, alt = 'Camera', className, style }) => {
          if (!message || !message.data) {
            return <div>Waiting for camera data...</div>;
          }

          const src = useMemo(() => {
            let mime = 'image/png';
            if (message.format && typeof message.format === 'string') {
              const f = message.format.toLowerCase();
              if (f.includes('jpeg') || f.includes('jpg')) mime = 'image/jpeg';
              else if (f.includes('png')) mime = 'image/png';
              else if (f.includes('webp')) mime = 'image/webp';
            }
            return `data:${mime};base64,${message.data}`;
          }, [message]);

          return <img src={src} alt={alt} className={className} style={style} />;
        };

        return (
          <CameraImageRenderer
            message={imgMessage}
            className={imgClassName}
            style={imgStyle}
          />
        );
      })()}
    </>
  );
}

export default CameraData;