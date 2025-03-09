const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");

const app = express();

const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {
  white: null,
  black: null,
};
let currentPlayer = "w";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index", { title: "Chess Custom game" });
});

io.on("connection", function (uniquesocket) {
  console.log("New client connected:", uniquesocket.id);

  if (!players.white) {
    players.white = uniquesocket.id;
    console.log("White player assigned:", uniquesocket.id);
    uniquesocket.emit("playerRole", "w");
  } else if (!players.black) {
    players.black = uniquesocket.id;
    console.log("Black player assigned:", uniquesocket.id);
    uniquesocket.emit("playerRole", "b");
  } else {
    console.log("Spectator connected:", uniquesocket.id);
    uniquesocket.emit("spectatorRole");
  }

  //Logic is explained here initially :- players ={}
  //players ={
  //   white:aojoboshgowjgwwwuwguj;
  //   black:nojwjjwue0ujfjpjgpj;
  //}

  // uniquesocket.on("disconnect", () => {
  //   //actually game should be disconnected but that will be complex
  //   if (uniquesocket.id == players.white) {
  //     delete players.white;
  //   } else if (uniquesocket.id == players.black) {
  //     delete players.black;
  //   }
  // });

  uniquesocket.on("disconnect", () => {
    if (uniquesocket.id === players.white) {
      players.white = null;
    } else if (uniquesocket.id === players.black) {
      players.black = null;
    }
  });

  //first check if it is a valid move then update the game state
  //move event emitted from front end
  uniquesocket.on("move", (move) => {
    try {
      //ensuring the right ply plays right turn and even if other player trys it will move and then it will return back to its position like you can hold but can't place
      if (chess.turn() === "w" && uniquesocket.id !== players.white) return;
      if (chess.turn() === "b" && uniquesocket.id !== players.black) return;

      //update game state
      const result = chess.move(move); //this func checks valid or not and then moves
      if (result) {
        currentPlayer = chess.turn();
        io.emit("move", move); //sending it to all even spectators // when io is used it is used to tell to everyone and uniquesocket is used to tell to that particular person
        io.emit("boardState", chess.fen()); //eqn for board state.
      } else {
        console.log("Invalid move :", move);
        uniquesocket.emit("invalidMove", move);
      }
    } catch (e) {
      //if chess engine itself fails
      console.log(e);
      uniquesocket.emit("invalidMove", move);
    }
  });
});

server.listen(3000, () => {
  console.log("server listening on http://localhost:3000");
});
