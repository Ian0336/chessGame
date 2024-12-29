const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { checkWinner, isMoveValid } = require('./gameLogic');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 儲存房間狀態的內存結構
const rooms = {};

// 當玩家連接
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  console.log('Total users:', Object.keys(rooms));
  // 玩家取得所有房間
  socket.emit('roomsList', Object.keys(rooms));

  // 玩家創建房間
  socket.on('createRoom', (callback) => {
    let roomId = Math.random().toString(36).substring(7); // 生成隨機房間 ID
    while (rooms[roomId]) {
      roomId = Math.random().toString(36).substring(7);
    }


    rooms[roomId] = {
      board: Array(9).fill(null), // 初始化 3x3 棋盤
      players: [socket.id], // 記錄玩家
      turn: 0, // 0 為玩家 1，1 為玩家 2
    };

    socket.join(roomId);
    io.emit('roomsList', Object.keys(rooms)); // 通知所有玩家有新房間
    callback({ success: true, message: 'Room created', roomId});
  });

  // 玩家加入房間
  socket.on('joinRoom', (roomId, callback) => {
    const room = rooms[roomId];
    if (!room) {
      return callback({ success: false, message: 'Room does not exist' });
    }

    if (room.players.length >= 2) {
      return callback({ success: false, message: 'Room is full' });
    }

    room.players.push(socket.id);
    socket.join(roomId);
    callback({ success: true, message: 'Joined the room' });

    // 通知房間中的玩家
    io.to(roomId).emit('roomUpdate', { players: room.players });
  });

  // 玩家下棋
  socket.on('makeMove', (roomId, index, callback) => {
    const room = rooms[roomId];
    if (!room) {
      return callback({ success: false, message: 'Room does not exist' });
    }

    const { board, players, turn } = room;

    if (socket.id !== players[turn]) {
      return callback({ success: false, message: 'Not your turn' });
    }

    if (!isMoveValid(board, index)) {
      return callback({ success: false, message: 'Invalid move' });
    }

    // 更新棋盤
    board[index] = turn === 0 ? 'X' : 'O';
    room.turn = 1 - turn; // 切換回合

    // 檢查是否有贏家
    const winner = checkWinner(board);
    if (winner) {
      io.to(roomId).emit('gameOver', { winner });
      delete rooms[roomId]; // 遊戲結束後移除房間
    } else {
      io.to(roomId).emit('boardUpdate', { board, turn: room.turn });
    }

    callback({ success: true });
  });

  // 玩家斷開連接
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
    // 移除玩家並清理房間
    // for (const roomId in rooms) {
    //   const room = rooms[roomId];
    //   room.players = room.players.filter((player) => player !== socket.id);

    //   // 如果房間空了，刪除房間
    //   if (room.players.length === 0) {
    //     delete rooms[roomId];
    //   }
    // }
  });
});

server.listen(4000, () => {
  console.log('Server running on http://localhost:4000');
});
