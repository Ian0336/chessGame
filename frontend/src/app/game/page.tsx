
'use client';
import { use, useEffect, useState } from 'react';
import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import {OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useSpring, animated } from '@react-spring/three'


const RAW_LENGTH = 3;
const BLOCK_LENGTH = 2;
const OFFSET_X = -RAW_LENGTH * BLOCK_LENGTH / 3 ;
const OFFSET_Y = -RAW_LENGTH * BLOCK_LENGTH / 3 ;
const COLOR_OF_PLAYER = [0x881100, 0x2f18d5];
type Player = {
  id: number;
  name: string;
  chessList: Array<[number, number]>;
}
export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [state, setState] = useState(0);
  const [turn, setTurn] = useState(0);
  const [player1, setPlayer1] = useState<Player>({id: 0, name: "player1", chessList: []});
  const [player2, setPlayer2] = useState<Player>({id: 1, name: "player2", chessList: []});
  const [animatedChess, setAnimatedChess] = useState({player: 0, pos: [1, 1], down: false});

  useEffect(() => {
    setIsClient(true);

  }, []);
  if (!isClient) {
    return null;
  }

  const handClickChessBoard = (e: any) => {
    console.log(e);
    if (player1.chessList.some(pos => pos[0] === e.row && pos[1] === e.col) || player2.chessList.some(pos => pos[0] === e.row && pos[1] === e.col)) {
      return;
    }
    if (e.row == animatedChess.pos[0] && e.col == animatedChess.pos[1]) {
      setAnimatedChess({...animatedChess, down: true});
      return;
    }
    if(animatedChess.down) {
      return
    }
    setAnimatedChess({player: turn, pos: [e.row, e.col], down: false});
  }
  const handleAddChess = (player: number, pos: [number, number]) => {
    if (player === 0) {
      setPlayer1({...player1, chessList: [...player1.chessList, pos]});
    } else {
      setPlayer2({...player2, chessList: [...player2.chessList, pos]});
    }
    setTurn((turn + 1) % 2);
    setAnimatedChess({player: (turn + 1) % 2, pos: [1, 1], down: false});
  }

  
  
  return (
    <div style={{height:"100vh"}}>
      <Canvas camera={{ position: [10, 10, 10], fov: 33 }} >
        <ambientLight intensity={1.5}  />
        <directionalLight position={[0, 3, 0]} color={new THREE.Color(COLOR_OF_PLAYER[turn])} intensity={3}/>
        <Chessboard handClickChessBoard={handClickChessBoard} />
        <Chesses player={player1.id} chessList={player1.chessList} />
        <Chesses player={player2.id} chessList={player2.chessList} />
        <AnimatedChess player={animatedChess.player} pos={animatedChess.pos as any} down={animatedChess.down} handleAddChess={handleAddChess} />
        {/* <OrbitControls rotateSpeed={0.3}  enableZoom={true} /> */}
        <OrbitControls rotateSpeed={0.3} minPolarAngle={Math.PI / 8} maxPolarAngle={Math.PI / 3.5} enableZoom={false}  enablePan={false}/>
      </Canvas>
      test
    </div>

  );
}

function AnimatedChess({player, pos, down, handleAddChess}: {player: number, pos: [number, number], down?: boolean, handleAddChess: any}) {
  const [visible, setVisible] = useState(true);
  const { position } = useSpring({
    position: down?[pos[1] * BLOCK_LENGTH + OFFSET_X, 1.2, pos[0] * BLOCK_LENGTH +OFFSET_Y]:[pos[1] * BLOCK_LENGTH + OFFSET_X, 2.2, pos[0] * BLOCK_LENGTH +OFFSET_Y],
    config: { mass: 1, tension: 170, friction: 26 },
    onRest: () => {
      if (down) {
        setVisible(false);
        handleAddChess(player, pos);
      }
    }
  });
  useEffect(() => {
    if(!down) {
      setVisible(true);
    }
  }
  , [down]);
  console.log(position.animation.toValues);
  return (
    <animated.mesh
      position={position as any}
      visible={visible}
    >
      <cylinderGeometry args={[0.3, 0.3, 0.1, 32]} /> {/* 使用圓柱體作為棋子的形狀 */}
      <meshStandardMaterial color={new THREE.Color(COLOR_OF_PLAYER[player])} /> {/* 根據位置設定顏色 */}
    </animated.mesh>
  );
}
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
              color={'white'}
            />
          </mesh>
        ))
      )}
      {/* 棋盤的邊界 */}
      <BoardBoundary />

    </mesh>
  );
}
function Chesses({player, chessList}: {player: number, chessList: Array<[number, number]>}) {

  return (
    <>
      {chessList.map((pos) => (
        <mesh position={[pos[1] * BLOCK_LENGTH + OFFSET_X, 1.2, pos[0] * BLOCK_LENGTH +OFFSET_Y]} key={`chess${player} ${pos[0]} ${pos[1]}`}>
          <cylinderGeometry args={[0.3, 0.3, 0.1, 32]} /> {/* 使用圓柱體作為棋子的形狀 */}
          <meshStandardMaterial color={new THREE.Color(COLOR_OF_PLAYER[player])} /> {/* 根據位置設定顏色 */}
        </mesh>
      ))}
    </>
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
