'use client';
import React, { useEffect, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import {RAW_LENGTH, BLOCK_LENGTH} from '../_utils/helper';

function Chessboard({handClickChessBoard}: {handClickChessBoard: any}) {
  const boardRef = useRef<THREE.Mesh>(null);
  return (
    <mesh ref={boardRef}>
      {/* chessboard base */}
      {[...Array(RAW_LENGTH)].map((_, row) =>
        [...Array(RAW_LENGTH)].map((_, col) => (
          <mesh
            key={`${row}-${col}`}
            position={[(col - (RAW_LENGTH-1) / 2) * BLOCK_LENGTH, 0, (row - (RAW_LENGTH-1) / 2) * BLOCK_LENGTH]}
          >
            <boxGeometry 
              args={[BLOCK_LENGTH, 2, BLOCK_LENGTH]}
            />
            <meshStandardMaterial
              color="gray"
            />
          </mesh>
        ))
      )}
      {/* chessboard grid */}
      {[...Array(RAW_LENGTH)].map((_, row) =>
        [...Array(RAW_LENGTH)].map((_, col) => (
          <mesh
            key={`${row}-${col}`}
            position={[(col - (RAW_LENGTH-1) / 2) * BLOCK_LENGTH, 1.05, (row - (RAW_LENGTH-1) / 2) * BLOCK_LENGTH]}
            onPointerUp={() => handClickChessBoard({"row": row, "col": col})}
          >
            <boxGeometry 
              args={[BLOCK_LENGTH, 0.1, BLOCK_LENGTH]}
            />
            <meshStandardMaterial
              // color={(row + col) % 2 === 0 ? 'white' : 'black'}
              color={new THREE.Color(0xaaaaaa)}
            />
          </mesh>
        ))
      )}
      {/* 棋盤的邊界 */}
      <BoardBoundary />

    </mesh>
  );
}
function BoardBoundary() {
  const wallHeight = 2.5;
  const wallWidth = 3;
  let dir = ["up", "down", "left", "right"]
  let posOfDir: { [key: string]: [number, number, number] } = {
    "up": [0, 0, -RAW_LENGTH * BLOCK_LENGTH / 2 - wallWidth / 2],
    "down": [0, 0, RAW_LENGTH * BLOCK_LENGTH / 2 + wallWidth / 2],
    "left": [-RAW_LENGTH * BLOCK_LENGTH / 2 - wallWidth / 2, 0, 0],
    "right": [RAW_LENGTH * BLOCK_LENGTH / 2 + wallWidth / 2, 0, 0]
  }
  let argsOfDir: { [key: string]: [number, number, number] } = {
    "up": [RAW_LENGTH * BLOCK_LENGTH, wallHeight, wallWidth],
    "down": [RAW_LENGTH * BLOCK_LENGTH, wallHeight, wallWidth],
    "left": [wallWidth, wallHeight, RAW_LENGTH * BLOCK_LENGTH],
    "right": [wallWidth, wallHeight, RAW_LENGTH * BLOCK_LENGTH]
  }
  let linesPos = [
    [-RAW_LENGTH, 0, -BLOCK_LENGTH/2, RAW_LENGTH, 0, -BLOCK_LENGTH / 2,],
    [-RAW_LENGTH, 0, BLOCK_LENGTH / 2, RAW_LENGTH, 0, BLOCK_LENGTH / 2,],
    [-BLOCK_LENGTH / 2, 0, -RAW_LENGTH, -BLOCK_LENGTH / 2, 0, RAW_LENGTH,],
    [BLOCK_LENGTH / 2, 0, -RAW_LENGTH, BLOCK_LENGTH / 2, 0, RAW_LENGTH,],
  ]
  return (
    <>
      {dir.map((d) => (
        <mesh
          key={d}
          position={posOfDir[d]}
          // onPointerUp={() => setHovered(()=>null)}
        >
          <boxGeometry args={argsOfDir[d]} />
          <meshStandardMaterial color="yellow" visible={false}/>
        </mesh>
      ))}
      <group rotation={[0, 0, 0]} position={[0, 1.11, 0]}>
        {linesPos.map((pos) => (
          <lineSegments key={pos.toString()}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                array={new Float32Array(pos)}
                count={2}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="black" />
          </lineSegments>
        ))}
      </group>
    </>
  );
}
export default Chessboard;