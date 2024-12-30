// battleRoom[roomId] ={
//   players: room.players,
//   turn: turn,
//   allChess: [], // [[playerid, posX, posY]...]
//   animatedChess: {player:turn, pos: [1, 1], down: false},
// }

function checkWinner(roomInfo) {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    let board = Array(9).fill(null);
    const { allChess } = roomInfo;
    for (let i = 0; i < allChess.length; i++) {
      const [playerId, x, y] = allChess[i];
      board[x + y * 3] = playerId;
    }
  
    for (let line of lines) {
      const [a, b, c] = line;
      if (board[a] != null && board[a] === board[b] && board[a] === board[c]) {
        return roomInfo.players[board[a]];; // 贏家 playerId
      }
    }
  
    return null; // 無贏家
  }
  
  function isMoveValid(roomInfo, posX, posY) {
    const { allChess } = roomInfo;
    if (allChess.length === 0) {
      return true;
    }
    for (let i = 0; i < allChess.length; i++) {
      const [playerId, x, y] = allChess[i];
      if (x === posX && y === posY) {
        return false;
      }
    }
    return true;
}
  
  module.exports = { checkWinner, isMoveValid };
  