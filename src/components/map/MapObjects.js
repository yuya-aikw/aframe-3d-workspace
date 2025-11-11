"use client";

import React from 'react';

// ここに地図を構成するオブジェクトを定義します。
// type: 'primitive' (基本形状), 'gltf' (3Dモデル), 'compound' (複合オブジェクト)
const mapObjects = [
  {
    id: 'sample-box-1',
    type: 'primitive',
    geometry: { primitive: 'box', width: 1, height: 3, depth: 1 },
    position: '5 1.5 5',
    rotation: '0 45 0',
    material: { color: '#4CC3D9' }
  },
  {
    id: 'sample-sphere-1',
    type: 'primitive',
    geometry: { primitive: 'sphere', radius: 0.8 },
    position: '-5 0.8 5',
    material: { color: '#EF2D5E' }
  },

  // --- GLTFモデルの例 ---
  // このコメントを外し、srcパスを書き換えればモデルを読み込めます。
  /*
  {
    id: 'sample-gltf-model-1',
    type: 'gltf',
    src: '/path/to/your-model.gltf', // publicフォルダからのパス
    position: '0 0.5 -10',
    rotation: '0 0 0',
    scale: '0.5 0.5 0.5'
  }
  */

  // --- 複合オブジェクトの例 ---
  // 複数のパーツからなるオブジェクトを定義できます。
  /*
  {
    id: 'my-compound-object',
    type: 'compound',
    position: '-10 0 0', // オブジェクト全体の座標
    rotation: '0 0 0',   // オブジェクト全体の回転
    parts: [
      {
        id: 'compound-part-1',
        type: 'gltf',
        src: '/path/to/base.gltf', // ベースとなるモデル
        position: '0 0 0' // 親からの相対位置
      }
    ]
  }
  */
];

// A-Frameの属性文字列を生成するヘルパー関数
const toAframeAttribute = (obj) => {
  if (!obj) return '';
  return Object.entries(obj).map(([key, value]) => `${key}: ${value}`).join(';');
};

const renderPart = (part, assets) => {
  const assetId = `${part.id}-asset`;

  if (part.type === 'gltf') {
    
    assets.push(
      <a-asset-item key={assetId} id={assetId} src={part.src}></a-asset-item>
    );
    
    return (
      <a-entity
        key={part.id}
        id={part.id}
        gltf-model={`#${assetId}`}
        position={part.position || '0 0 0'}
        rotation={part.rotation || '0 0 0'}
        scale={part.scale || '1 1 1'}
      />
    );
  } else {
    return (
      <a-entity
        key={part.id}
        id={part.id}
        geometry={toAframeAttribute(part.geometry)}
        position={part.position || '0 0 0'}
        rotation={part.rotation || '0 0 0'}
        scale={part.scale || '1 1 1'}
        material={toAframeAttribute(part.material)}
      />
    );
  }
};



export const processMapObjects = () => {
  const assets = [];
  const entities = [];

  for (const obj of mapObjects) {
    if (obj.type === 'compound') {
      // 複合オブジェクトの場合
      const childParts = obj.parts ? obj.parts.map(part => renderPart(part, assets)) : [];
      entities.push(
        <a-entity
          key={obj.id}
          id={obj.id}
          position={obj.position}
          rotation={obj.rotation || '0 0 0'}
          scale={obj.scale || '1 1 1'}
        >
          {childParts}
        </a-entity>
      );
    } else {
      // 単一オブジェクト（primitiveまたはgltf）の場合
      entities.push(renderPart(obj, assets));
    }
  }

  return { assets, entities };
};