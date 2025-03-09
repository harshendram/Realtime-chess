const socket = io(); //establishes the connection from frontend

// Initialize Notyf
const notyf = new Notyf();
socket.on("invalidMove", (move) => {
  notyf.error("Invalid move. Please try again!");
});

const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
  const board = chess.board();
  boardElement.innerHTML = "";
  board.forEach((row, rowindex) => {
    row.forEach((square, squareindex) => {
      const squareElement = document.createElement("div");
      squareElement.classList.add(
        "square",
        (rowindex + squareindex) % 2 === 0 ? "light" : "dark" //for coloring the board alternatively
      );
      squareElement.dataset.row = rowindex;
      squareElement.dataset.col = squareindex; //learn more about dataset

      if (square) {
        //if the squares are not null meaning they consist pieces

        const pieceElement = document.createElement("div");
        pieceElement.classList.add(
          "piece",
          square.color === "w" ? "white" : "black" //white pieces or black ones
        );
        pieceElement.innerHTML = getUnicode(square);
        pieceElement.draggable = playerRole === square.color; //true or false i should be able to drag only my pieces not opponents

        pieceElement.addEventListener("dragstart", (e) => {
          if (pieceElement.draggable) {
            draggedPiece = pieceElement;
            sourceSquare = { row: rowindex, col: squareindex };
            e.dataTransfer.setData("text/plain", ""); //helpful for cross browser smooth flow
          }
        });

        pieceElement.addEventListener("dragend", (e) => {
          draggedPiece = null;
          sourceSquare = null;
        });

        squareElement.appendChild(pieceElement);
      }

      squareElement.addEventListener("dragover", function (e) {
        e.preventDefault();
      });

      squareElement.addEventListener("drop", function (e) {
        e.preventDefault();
        if (draggedPiece) {
          const targetSource = {
            row: parseInt(squareElement.dataset.row), // since this will be stored in form of strings data-
            col: parseInt(squareElement.dataset.col),
          };

          handleMove(sourceSquare, targetSource, playerRole);
        }
      });
      boardElement.appendChild(squareElement);
    });
  });

  if (playerRole === "b") {
    boardElement.classList.add("flipped");
  } else {
    boardElement.classList.remove("flipped");
  }
};

const handleMove = (source, target, playerRole) => {
  const move = {
    from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
    to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`, //D5 like that
  };
  console.log("Attempting move:", move); // Debug log
  socket.emit("move", move);
};

const getUnicode = (piece) => {
  const unicodePieces = {
    K: "♔", // White King
    Q: "♕", // White Queen
    R: "♖", // White Rook
    B: "♗", // White Bishop
    N: "♘", // White Knight
    P: "♙", // White Pawn
    k: "♚", // Black King
    q: "♛", // Black Queen
    r: "♜", // Black Rook
    b: "♝", // Black Bishop
    n: "♞", // Black Knight
    p: "♟︎", // Black Pawn
  };
  return unicodePieces[piece.type] || "";
};

socket.on("playerRole", function (role) {
  playerRole = role;
  renderBoard();
});

socket.on("spectatorRole", function (role) {
  playerRole = null;
  renderBoard();
});

socket.on("boardState", function (fen) {
  chess.load(fen);
  renderBoard();
});

socket.on("move", function (move) {
  console.log("Received move from server:", move);
  chess.move(move);
  console.log("New board state after move:", chess.fen());
  renderBoard();
});

renderBoard();
