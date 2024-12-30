const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { checkWinner, isMoveValid } = require('./gameLogic');
const { type } = require('os');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 儲存房間狀態的內存結構
const waitingRoom = {}
const battleRoom = {}

// 當玩家連接
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // 玩家創建房間
  socket.on('createRoom', (callback) => {
    let roomId = Math.random().toString(36).substring(7); // 生成隨機房間 ID
    while (waitingRoom[roomId] || battleRoom[roomId]) {
      roomId = Math.random().toString(36).substring(7);
    }


    waitingRoom[roomId] = {
      // board: Array(9).fill(null), // 初始化 3x3 棋盤
      // players: [socket.id], // 記錄玩家
      players: [], // 記錄玩家
      // turn: 0, // 0 為玩家 1，1 為玩家 2
    };

    // socket.join(roomId);
    io.emit('roomsList', Object.keys(waitingRoom)); // 通知所有玩家有新房間
    callback({ success: true, message: 'Room created', roomId});
  });

  socket.on('requestRooms', (callback) => {
    callback(Object.keys(waitingRoom)); // 使用回調返回房間列表
  });

  // 玩家加入房間
  socket.on('joinRoom', (roomId, callback) => {
    const room = waitingRoom[roomId];
    if (!room) {
      return callback({ success: false, message: 'Room does not exist' });
    }

    if (room.players.length >= 2) {
      return callback({ success: false, message: 'Room is full' });
    }

    room.players.push(socket.id);
    socket.join(roomId);
    callback({ success: true, message: 'Joined the room', roomId });

    console.log('room.players:', room.players);
    // 如果房間滿了，開始遊戲
    if (room.players.length === 2) {
      let turn = Math.round(Math.random()); // 隨機選擇先手
      battleRoom[roomId] ={
        players: room.players,
        turn: turn,
        allChess: [], // [[playerid, posX, posY]...]
        animatedChess: {player:turn, pos: [1, 1], down: false},
      }
      delete waitingRoom[roomId];
      io.emit('roomsList', Object.keys(waitingRoom)); // 通知所有玩家有房間被刪除
      // 通知房間中的玩家
      io.to(roomId).emit('gameStart', { roomId, ...battleRoom[roomId] });
    }
    
  });

  socket.on('initGame', (roomId, callback) => {
    const room = battleRoom[roomId];
    if (!room) {
      return callback({ success: false, message: 'Room does not exist' });
    }
    callback({ success: true, message: 'Room exist', room });
    // console.log('/////////initGame:', socket.id, roomId, room);
  }
  );

  socket.on('playerMove', (args, callback) => {
    // console.log('playerMove:', args, socket.id);
    // console.log('battleRoom:', battleRoom[args.roomId]);
    let playerId = battleRoom[args.roomId].players.indexOf(socket.id);
    if (playerId === -1){
      return callback({ success: false, message: 'Not in the room' });
    }
    let room = battleRoom[args.roomId];
    if (!room) {
      return callback({ success: false, message: 'Room does not exist' });
    }
    if (playerId !== room.turn){
      return callback({ success: false, message: 'Not your turn' });
    }
    if(!isMoveValid(room, args.pos[0], args.pos[1])){
      return callback({ success: false, message: 'Invalid move' });
    }

    console.log('moveType:', args.moveType);
    if (args.moveType === 'animatedChess'){
      const {player, pos, down} = args;
      
      battleRoom[args.roomId].animatedChess = {player, pos, down};
      // io.to(args.roomId).emit('animatedChess', {player, pos, down});
      callback({ success: true, message: 'animatedChess'});
    }
    if (args.moveType === 'addChess'){
      console.log('last Turn:', battleRoom[args.roomId].turn);
      const {player, pos} = args;
      let nextPlayer = (battleRoom[args.roomId].turn + 1) % 2;
      battleRoom[args.roomId].allChess.push([player, pos[0], pos[1]]);
      battleRoom[args.roomId].turn = nextPlayer
      battleRoom[args.roomId].animatedChess = {player: nextPlayer, pos: [1, 1], down: false};
      // io.to(args.roomId).emit('addChess', {player, pos});
      callback({ success: true, message: 'addChess'});

      let gameResult = checkWinner(battleRoom[args.roomId])
      if (gameResult){
        console.log('gameOver:', gameResult);
        battleRoom[args.roomId].animatedChess = {...battleRoom[args.roomId].animatedChess, pos: [-1, -1]};
        io.to(args.roomId).emit('updateGame', {room: battleRoom[args.roomId]});
        // delete battleRoom[args.roomId];
        setTimeout(() => {
          io.to(args.roomId).emit('gameOver', {winner: gameResult});
        }
        , 1000);
        return;
      }
      
    }

    io.to(args.roomId).emit('updateGame', {room: battleRoom[args.roomId]});
  });


  // 玩家下棋
  socket.on('makeMove', (roomId, index, callback) => {
    // const room = rooms[roomId];
    // if (!room) {
    //   return callback({ success: false, message: 'Room does not exist' });
    // }

    // const { board, players, turn } = room;

    // if (socket.id !== players[turn]) {
    //   return callback({ success: false, message: 'Not your turn' });
    // }

    // if (!isMoveValid(board, index)) {
    //   return callback({ success: false, message: 'Invalid move' });
    // }

    // // 更新棋盤
    // board[index] = turn === 0 ? 'X' : 'O';
    // room.turn = 1 - turn; // 切換回合

    // // 檢查是否有贏家
    // const winner = checkWinner(board);
    // if (winner) {
    //   io.to(roomId).emit('gameOver', { winner });
    //   delete rooms[roomId]; // 遊戲結束後移除房間
    // } else {
    //   io.to(roomId).emit('boardUpdate', { board, turn: room.turn });
    // }

    // callback({ success: true });
  });

  // 玩家斷開連接
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
    // 移除玩家並清理房間
    for (const roomId in waitingRoom) {
      const room = waitingRoom[roomId];
      room.players = room.players.filter((player) => player !== socket.id);

      // 如果房間空了，刪除房間
      if (room.players.length === 0) {
        delete waitingRoom[roomId];
      }
    }
    io.emit('roomsList', Object.keys(waitingRoom)); // 通知所有玩家有房間被刪除
  });
});

server.listen(4000, () => {
  console.log('Server running on http://localhost:4000');
});
