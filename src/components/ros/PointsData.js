import React, { useEffect, useState } from 'react';
import ROSLIB from 'roslib';

const PointsData = ({ ros }) => {
    const [data, setData] = useState(null);

    useEffect(() => {
        if (!ros) {
            return;
        }

        var pointcloud = new ROSLIB.Topic({
            ros: ros,
            name : '/livox/lidar',
            messageType : 'sensor_msgs/PointCloud2'
        });

        pointcloud.subscribe(function (message) {
              // messageをstateに保存
              setData(message);
        });

    }, [ros]);

    return (
            <>
                <RenderAt2Hz data={data} />
            </>
    );
}

// data を受け取り何らかの変換を行って React ノードを返す関数のサンプル
        const processPointCloud = (message) => {
            if (!message) {
                return <div>No pointcloud yet</div>;
            }

            // PointCloud2 の単純なサマリを作る例
            // 通常、points 数は width * height（多くの LIDAR は height=1）
            const width = message.width ?? 0;
            const height = message.height ?? 0;
            const pointCount = (width && height) ? width * height : 'unknown';

            // タイムスタンプの読み取り（存在すれば）
            const sec = message.header?.stamp?.sec;
            const nsec = message.header?.stamp?.nsec;
            const timestamp = (sec !== undefined && nsec !== undefined) ? `${sec}.${String(nsec).padStart(9,'0')}` : 'unknown';

            return (
                <div>
                    <div><strong>Point count:</strong> {pointCount}</div>
                    <div><strong>Timestamp:</strong> {timestamp}</div>
                    {/* ここにさらに message.data の解析結果やビジュアライザへのパスを入れられます */}
                </div>
            );
        }

        // 2Hzで processPointCloud の結果をレンダリングするコンポーネント
        const RenderAt2Hz = ({ data }) => {
            const [tick, setTick] = useState(0);
            useEffect(() => {
                const interval = setInterval(() => {
                    setTick(t => t + 1);
                }, 500); // 0.5秒ごと
                return () => clearInterval(interval);
            }, []);

            // tick が変わるたびに再評価され、最新の `data` を processPointCloud に渡す
            return (
                <div>
                    {processPointCloud(data)}
                </div>
            );
        }

export default PointsData