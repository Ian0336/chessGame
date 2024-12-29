function checkWinner(board) {
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
  
    for (let line of lines) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a]; // 返回贏家 (X 或 O)
      }
    }
  
    return null; // 無贏家
  }
  
  function isMoveValid(board, index) {
    return board[index] === null; // 如果棋盤該位置為空，則合法
  }
  
  module.exports = { checkWinner, isMoveValid };
  