'use client'
import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import Chessboard from './_components/Chessboard';

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [players, setPlayers] = useState<string[]>([]);

  useEffect(() => {
    setIsClient(true);
    // 模擬配對進程
    const interval = setInterval(() => {
      setPlayers((prev) => {
        if (prev.length < 5) {
          return [...prev, `Player ${prev.length + 1}`];
        }
        clearInterval(interval);
        return prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isClient) return null;

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* 旋轉的棋盤 */}
      <Canvas camera={{ position: [10, 10, 10], fov: 33 }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[0, 3, 0]} intensity={3} />
        <RotatingBoard />
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>

      {/* 浮動的配對列表 */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center',
        }}
      >
        <h2>正在配對...</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {players.map((player, index) => (
            <li key={index} style={{ margin: '5px 0' }}>
              {player}
            </li>
          ))}
        </ul>
        <button
          style={{
            padding: '10px 20px',
            background: 'white',
            color: 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
          // ckick go to /game
          onClick={() => {
            window.location.href = '/game';
          }}
        >To reset</button>
      </div>
    </div>
  );
}

function RotatingBoard() {
  const ref = React.useRef<THREE.Group>(null);
  useEffect(() => {
    const interval = setInterval(() => {
      if (ref.current) {
        ref.current.rotation.y += 0.01;
      }
    }, 16);
    return () => clearInterval(interval);
  }, []);
  return (
    <group ref={ref}>
      <Chessboard handClickChessBoard={() => {}} />
    </group>
  );
}
