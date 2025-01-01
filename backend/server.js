const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { checkWinner, isMoveValid } = require('./gameLogic');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 儲存房間狀態的 Map 結構
const waitingRoom = new Map();
const battleRoom = new Map();
const locks = new Map();

async function acquireLock(key) {
  while (locks.has(key)) {
    await new Promise(resolve => setTimeout(resolve, 10)); // 等待鎖被釋放
  }
  locks.set(key, true);
}

function releaseLock(key) {
  locks.delete(key);
}

// 當玩家連接
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // 玩家創建房間
  socket.on('createRoom', async (callback) => {
    let roomId = Math.random().toString(36).substring(7); // 生成隨機房間 ID

    while (waitingRoom.has(roomId) || battleRoom.has(roomId)) {
      roomId = Math.random().toString(36).substring(7);
    }

    await acquireLock('waitingRoom');
    try {
      waitingRoom.set(roomId, {
        players: [], // 記錄玩家
        timeStamp: Date.now(),
      });
    } catch (e) {
        console.error(e);
        return callback({ success: false, message: 'Failed to create room' });
    } finally {
      releaseLock('waitingRoom');
    }

    io.emit('roomsList', Array.from(waitingRoom.keys())); // 通知所有玩家有新房間
    callback({ success: true, message: 'Room created', roomId });
  });

  socket.on('requestRooms', (callback) => {
    callback(Array.from(waitingRoom.keys())); // 返回房間列表
  });

  // 玩家加入房間
  socket.on('joinRoom', async (roomId, callback) => {
    await acquireLock(roomId);
    try {
      const room = waitingRoom.get(roomId);
      if (!room) {
        return callback({ success: false, message: 'Room does not exist' });
      }

      if (room.players.length >= 2) {
        return callback({ success: false, message: 'Room is full' });
      }

      room.players.push(socket.id);
      socket.join(roomId);
      callback({ success: true, message: 'Joined the room', roomId });

      if (room.players.length === 2) {
        const turn = Math.round(Math.random()); // 隨機選擇先手
        battleRoom.set(roomId, {
          players: room.players,
          turn: turn,
          allChess: [], // [[playerId, posX, posY]...]
          animatedChess: { player: turn, pos: [1, 1], down: false },
          timeStamp: Date.now(),
        });
        waitingRoom.delete(roomId);
        io.emit('roomsList', Array.from(waitingRoom.keys())); // 通知所有玩家有房間被刪除
        io.to(roomId).emit('gameStart', { roomId, ...battleRoom.get(roomId) });
      }
    } finally {
      releaseLock(roomId);
    }
  });

  socket.on('initGame', (roomId, callback) => {
    const room = battleRoom.get(roomId);
    if (!room) {
      return callback({ success: false, message: 'Room does not exist' });
    }
    callback({ success: true, message: 'Room exist', room });
  });

  socket.on('playerMove', (args, callback) => {
    const roomId = args.roomId;

    const room = battleRoom.get(roomId);
    if (!room) {
      return callback({ success: false, message: 'Room does not exist' });
    }

    const playerId = room.players.indexOf(socket.id);
    if (playerId === -1) {
      return callback({ success: false, message: 'Not in the room' });
    }

    if (playerId !== room.turn) {
      return callback({ success: false, message: 'Not your turn' });
    }

    if (!isMoveValid(room, args.pos[0], args.pos[1])) {
      return callback({ success: false, message: 'Invalid move' });
    }

    if (args.moveType === 'animatedChess') {
      const { player, pos, down } = args;
      room.animatedChess = { player, pos, down };
      callback({ success: true, message: 'animatedChess' });
    }

    if (args.moveType === 'addChess') {
      const { player, pos } = args;
      const nextPlayer = (room.turn + 1) % 2;

      room.allChess.push([player, pos[0], pos[1]]);
      if (room.allChess.length === 7) {
        room.allChess.shift(); // 保留最後 7 步
      }

      room.turn = nextPlayer;
      room.animatedChess = { player: nextPlayer, pos: [1, 1], down: false };
      callback({ success: true, message: 'addChess' });

      const gameResult = checkWinner(room);
      if (gameResult) {
        room.animatedChess = { ...room.animatedChess, pos: [-1, -1] };
        room.turn = -1;
        if (gameResult.winPos) {
          room.allChess = gameResult.winPos;
        }
        io.to(roomId).emit('updateGame', { room });
        setTimeout(() => {
          io.to(roomId).emit('gameOver', { winner: gameResult.winner });
          battleRoom.delete(roomId);
        }, 1000);
        return;
      }
    }

    io.to(roomId).emit('updateGame', { room });
  });

  // 玩家斷開連接
  socket.on('disconnect', async () => {
    console.log('A user disconnected:', socket.id);

    for (const [roomId, room] of waitingRoom.entries()) {
      room.players = room.players.filter((player) => player !== socket.id);
      if (room.players.length === 0) {
        waitingRoom.delete(roomId);
      }
    }
    
    for (const [roomId, room] of battleRoom.entries()) {
      let gameOver = room.players.indexOf(socket.id) !== -1;
      if (gameOver) {
        io.to(roomId).emit('gameOver', { winner: room.players[1-room.players.indexOf(socket.id)] });
        battleRoom.delete(roomId);
      }
    }
    io.emit('roomsList', Array.from(waitingRoom.keys())); // 更新房間列表
  });
  socket.on('leaveRoom', async (roomId ,callback) => {
    await acquireLock(roomId);
    try{
      const room = battleRoom.get(roomId);
      if (!room) {
        return callback({ success: false, message: 'Room does not exist' });
      }
      const playerId = room.players.indexOf(socket.id);
      if (playerId === -1) {
        return callback({ success: false, message: 'Not in the room' });
      }
      io.to(roomId).emit('gameOver', { winner: room.players[1-playerId] });
      battleRoom.delete(roomId);
    } finally {
      releaseLock(roomId);
    }
    
    callback({ success: true, message: 'Room left' });
  });
});


server.listen(4000, () => {
  console.log('Server running on http://localhost:4000');
});
