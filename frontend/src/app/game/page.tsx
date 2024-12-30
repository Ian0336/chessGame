
'use client';
import { use, useEffect, useState } from 'react';
import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import {OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useSpring, animated } from '@react-spring/three'
import {RAW_LENGTH, BLOCK_LENGTH, OFFSET_X, OFFSET_Y, COLOR_OF_PLAYER, Player} from '../_utils/helper';
import Chessboard from '../_components/Chessboard';
import { io } from 'socket.io-client';
import { useRouter, useSearchParams } from 'next/navigation';
import { SocketContext } from '../_components/socket';
import { pre } from 'framer-motion/client';


// const socket = io('http://localhost:30601');

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [roomPlayers, setRoomPlayers] = useState([]);
  const [turn, setTurn] = useState(0);
  const [player1, setPlayer1] = useState<Player>({id: 0, name: "player1", chessList: []});
  const [player2, setPlayer2] = useState<Player>({id: 1, name: "player2", chessList: []});
  const [animatedChess, setAnimatedChess] = useState({player: 0, pos: [1, 1], down: false});
  const searchParams = useSearchParams();
  const router = useRouter();
  const socket = React.useContext(SocketContext);
  const [gameOver, setGameOver] = useState('');

  useEffect(() => {
    // setIsClient(true);
    socket.on('updateGame', (data: any) => {
      console.log('updateGame', data);
      let roomInfo = data.room;
      let allChess = roomInfo.allChess;
      let player1Chess = allChess.filter((chess: any) => chess[0] === 0).map((chess: any) => [chess[1], chess[2]]);
      let player2Chess = allChess.filter((chess: any) => chess[0] === 1).map((chess: any) => [chess[1], chess[2]]);
      setPlayer1({...player1, chessList: player1Chess});
      setPlayer2({...player2, chessList: player2Chess});
      setTurn(prev => roomInfo.turn);
      setAnimatedChess(prev => roomInfo.animatedChess);
    }
    );
    socket.on('gameOver', (data: any) => {
      setGameOver(data.winner === socket.id? 'win' : 'lose'); 
      // window.alert(`Game Over! You are ${data.winner === socket.id ? 'winner' : 'loser'}`);
      // console.log('gameOver', data);
      // router.push('/');
    }
    );
    return () => {
      socket.off('updateGame');
      console.log('off updateGame');
    };
  }, []);
  useEffect(() => {
    const roomId = searchParams.get('roomId');
    if (roomId) {
      console.log('Room ID:', roomId);
      setRoomId(roomId);

      const params = new URLSearchParams(searchParams);
      params.delete('roomId');
      
      router.replace(`/game`);
    }
  }, [searchParams, router]);

  useEffect(() => {
    // init game by socket
    socket.emit('initGame', roomId, (response: any) => {
      console.log('initGame', response);

      if (response.success) {
        let roomInfo = response.room;
        console.log('initGame success', roomInfo);
        // setPlayer1({...player1, chessList: response.player1.chessList});
        // setPlayer2({...player2, chessList: response.player2.chessList});
        setTurn(prev => roomInfo.turn);
        setAnimatedChess(prev => roomInfo.animatedChess);
        // setChessList 
        let allChess = roomInfo.allChess;
        let player1Chess = allChess.filter((chess: any) => chess.player === 0).map((chess: any) => [chess.row, chess.col]);
        let player2Chess = allChess.filter((chess: any) => chess.player === 1).map((chess: any) => [chess.row, chess.col]);
        setPlayer1({...player1, chessList: player1Chess});
        setPlayer2({...player2, chessList: player2Chess});
        setRoomPlayers(roomInfo.players);

        setIsClient(true);
      }

      
    }
    );
  }, [roomId]);

  useEffect(() => {
    if (gameOver) {
      window.alert(`Game Over! You are ${gameOver}`);
      router.push('/');
    }
  }
  , [gameOver]);




  if (!isClient) {
    return null;
  }

  const handClickChessBoard = (e: any) => {
    if(roomPlayers[turn] !== socket.id) {
      return
    }
    console.log(e);
    if (player1.chessList.some(pos => pos[0] === e.row && pos[1] === e.col) || player2.chessList.some(pos => pos[0] === e.row && pos[1] === e.col)) {
      return;
    }
    if (e.row == animatedChess.pos[0] && e.col == animatedChess.pos[1]) {
      // setAnimatedChess({...animatedChess, down: true});{}
      socket.emit('playerMove', {roomId, moveType: 'animatedChess', ...animatedChess, down: true}, (response: any) => {
        console.log('playerMove', response);
      }
      );
      return;
    }
    if(animatedChess.down) {
      return
    }
    // setAnimatedChess({player: turn, pos: [e.row, e.col], down: false});
    socket.emit('playerMove', {roomId, moveType: 'animatedChess', player: turn, pos: [e.row, e.col], down: false}, (response: any) => {
      console.log('playerMove', response);
    } 
    );
  }
  const handleAddChess = (player: number, pos: [number, number]) => {
    if(roomPlayers[turn] !== socket.id) {
      return
    }
    socket.emit('playerMove', {roomId, moveType: 'addChess', player, pos}, (response: any) => {
      console.log('playerMove', response);
    }
    );
  }
  console.log(player1.chessList, '<<< player1.chessList');
  console.log(player2.chessList, '<<< player2.chessList');
  
  
  return (
    <div style={{height:"100vh"}}>
      <Canvas camera={{ position: [10, 10, 10], fov: 33 }} >
        <ambientLight intensity={1.5}  />
        <directionalLight position={[0, 3, 0]} color={new THREE.Color('0xaaaaaa')} intensity={3}/>
        <Chessboard handClickChessBoard={handClickChessBoard} />
        <Chesses player={player1.id} chessList={player1.chessList} />
        <Chesses player={player2.id} chessList={player2.chessList} />
        <AnimatedChess player={animatedChess.player} pos={animatedChess.pos as any} down={animatedChess.down} handleAddChess={handleAddChess} />
        {/* <OrbitControls rotateSpeed={0.3}  enableZoom={true} /> */}
        <OrbitControls rotateSpeed={0.3} minPolarAngle={Math.PI / 8} maxPolarAngle={Math.PI / 3.5} enableZoom={false}  enablePan={false}/>
      </Canvas>
    </div>

  );
}

function AnimatedChess({player, pos, down, handleAddChess}: {player: number, pos: [number, number], down?: boolean, handleAddChess: any}) {
  const [visible, setVisible] = useState(true);
  const [show, setShow] = useState(true);
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

  useEffect(() => {
    if(pos[0] == -1 && pos[1] == -1) {
      setShow(false);
    }else {
      setShow(true);
    }

  }
  , [pos]);
  console.log(position.animation.toValues);

  if (!show) {
    return null;
  }
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
