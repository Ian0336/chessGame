'use client'
import React, { useEffect, useState, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import Chessboard from './_components/Chessboard';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { pre, tr } from 'framer-motion/client';
import { is } from '@react-three/fiber/dist/declarations/src/core/utils';

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  useEffect(() => setIsClient(true), []);

  const handleEnterRoom = async(idx: number) => {
    console.log(`Enter room ${idx}`);
    setIsLoading(prev => true);
    const timer = setTimeout(() => {
      router.push(`/game`);
    }
    , 5000);
  };

  if (!isClient) return null;

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100vw'}}>
      {/* 旋轉的棋盤 */}
    <Canvas camera={{ position: isLoading ? [0, 10, 0] : [0, 10, 10], fov: isLoading ? 90 : 33 }} key = {isLoading? "loading" : "loading"}>
      <ambientLight intensity={1.5} />
      <directionalLight position={[0, 3, 0]} intensity={3} />
      <SmoothCamera isLoading={isLoading} />
      <RotatingBoard isLoading={isLoading} />
      <OrbitControls enableZoom={false} enablePan={false} />
    </Canvas>
      

      <AnimatePresence>
        {!isLoading && <MatchRooms handleEnterRoom={handleEnterRoom} />}
      </AnimatePresence>
      
    </div>
  );
}
function SmoothCamera({ isLoading }: { isLoading: boolean }) {
  const camera = useThree((state) => state.camera);
  const targetPosition = isLoading ? [0, 30, 0] : [0, 10, 10]; // 目標位置

  const positionRef = useRef(camera.position.clone());
  // const fovRef = useRef(camera.fov);

  useFrame(() => {
    // 平滑插值位置
    positionRef.current.lerp(new THREE.Vector3(...targetPosition), 0.05); // 插值位置
    camera.position.copy(positionRef.current);

    camera.updateProjectionMatrix(); // 更新相機矩陣
  });

  return null;
}
function MatchRooms({ handleEnterRoom }: { handleEnterRoom: (idx: number) => void }) {
  const [rooms, setRooms] = useState<string[]>([]);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  useEffect(() => {
    // 模擬已有房間
    const initialRooms = ['Room 1', 'Room 2', 'Room 3'];
    setRooms(initialRooms);
  }, []);

  const handleCreateRoom = () => {
    setIsCreatingRoom(true);
    setTimeout(() => {
      setRooms((prev) => [...prev, `Room ${prev.length + 1}`]);
      setIsCreatingRoom(false);
    }, 1000); // 模擬創建房間需要的時間
  };
  return (
    <motion.div
        initial={{ opacity: 0, transform: 'translate(-50%, -50%)', top: '100%'}}
        animate={{ opacity: 1, transform: 'translate(-50%, -50%)', top: '50%' }}
        exit={{ opacity: 0, transform: 'translate(-50%, -50%)', top: '100%' }}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'linear-gradient(135deg, #333333, #aaaaaa',
          color: 'white',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          width: '350px',
          textAlign: 'center',
        }}
      >
        <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Rooms</h2>
        <div style={{ height: '333px', overflowY: 'auto' }}>
          <AnimatePresence>
            {rooms.map((room, index) => (
              <motion.div
                key={room}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                style={{
                  background: 'linear-gradient(135deg, #777777, #333333',
                  padding: '10px 15px',
                  margin: '10px 0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
                whileHover={{ scale: 1.05 }}
                onClick={() => handleEnterRoom(index)}
              >
                {room}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <motion.button
          onClick={handleCreateRoom}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            fontSize: '16px',
            color: '#fff',
            background: '#333',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          disabled={isCreatingRoom}
        >
          {isCreatingRoom ? 'Creating...' : 'Create New Room'}
        </motion.button>
      </motion.div>
  );
}
function RotatingBoard({ isLoading }: { isLoading: boolean }) {
  const ref = React.useRef<THREE.Group>(null);
  useEffect(() => {
    console.log('isLoading', isLoading);
    const interval = setInterval(() => {
      if (ref.current) {
        ref.current.rotation.y += isLoading ? 0.02 : 0.01;
      }
    }, 16);
    return () => clearInterval(interval);
  }, [isLoading]);
  return (
    <group ref={ref}>
      <Chessboard handClickChessBoard={() => {}} />
    </group>
  );
}
