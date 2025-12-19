import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import ROSLIB from 'roslib';

// Generic RosTopicListener component
// Props:
// - ros: ROSLIB.Ros instance
// - topicName: topic name string
// - messageType: ROS message type string (e.g., 'sensor_msgs/CompressedImage')
// - onMessage: callback(message: ROSMessage) where message structure matches messageType
//   For example, with 'sensor_msgs/CompressedImage', message has { format: string, data: string }
// - throttleMs: number to throttle calls to onMessage (default 0 = no throttle)
// Exposes via ref: { subscribe(), unsubscribe() } for manual control if needed
const RosTopicListener = forwardRef(({
  ros,
  topicName = '',
  messageType = '',
  onMessage,
  throttleMs = 0,
}, ref) => {
  const topicRef = useRef(null);
  const handlerRef = useRef(null);
  const lastTsRef = useRef(0);
  const onMessageRef = useRef(onMessage);

  // Keep onMessage callback up to date
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const internalHandler = (message) => {
    // Ensure message exists and has expected structure based on messageType
    if (!message) return;
    const now = Date.now();
    if (throttleMs > 0 && now - lastTsRef.current < throttleMs) return;
    lastTsRef.current = now;

    try {
      // Pass ROS message to callback. Message structure matches messageType
      onMessageRef.current(message);
    } catch (e) {
      console.warn(`Error in onMessage handler for ${messageType}:`, e);
    }
  };

  useEffect(() => {
    if (!ros) {
      // Clean up when ros becomes null
      unsubscribe();
      topicRef.current = null;
      return;
    }

    // Create a Topic instance for this listener
    const topic = new ROSLIB.Topic({
      ros: ros,
      name: topicName,
      messageType: messageType,
    });
    topicRef.current = topic;
    
    // Always subscribe when topic is created
    subscribe();

    return () => {
      unsubscribe();
      topicRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ros, topicName, messageType]);

  const subscribe = () => {
    if (!topicRef.current) return;
    if (handlerRef.current) return; // already subscribed
    handlerRef.current = internalHandler;
    topicRef.current.subscribe(handlerRef.current);
  };

  const unsubscribe = () => {
    if (!topicRef.current || !handlerRef.current) return;
    try { topicRef.current.unsubscribe(handlerRef.current); } catch (e) { /* ignore */ }
    handlerRef.current = null;
  };

  useImperativeHandle(ref, () => ({
    subscribe,
    unsubscribe,
  }), []);

  return null;
});

export default RosTopicListener;
