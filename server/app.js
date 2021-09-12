const app = require("http").createServer();
const io = require("socket.io")(app, {
  cors: {
    origin: "https://multi-snake-game.netlify.app",
    methods: ["GET", "POST"],
    credentials: true,
  },
});
const { gameLoop, getUpdatedVelocity, initGame } = require("./game");
const { FRAME_RATE } = require("./constants");
const { makeid } = require("./utils");

const state = {};
const clientRooms = {};

io.on("connection", (client) => {
  client.on("keydown", handleKeyDown);
  client.on("newGame", handleNewGame);
  client.on("joinGame", handleJoinGame);

  function handleJoinGame(gameCode) {
    const room = io.sockets.adapter.rooms.get(gameCode);
    const numClients = room ? room.size : 0;

    if (numClients === 0) {
      client.emit("unknownGame");
      return;
    } else if (numClients > 1) {
      client.emit("tooManyPlayers");
      return;
    }
    clientRooms[client.id] = gameCode;

    client.join(gameCode);
    client.number = 2;
    client.emit("init", 2);

    startGameInterval(gameCode);
  }

  function handleKeyDown(keyCode) {
    const roomName = clientRooms[client.id];

    if (!roomName) {
      return;
    }

    try {
      keyCode = parseInt(keyCode);
    } catch (e) {
      console.error(e);
      return;
    }

    const vel = getUpdatedVelocity(keyCode);

    if (vel) {
      state[roomName].players[client.number - 1].vel = vel;
    }
  }

  function handleNewGame() {
    let roomName = makeid(5);
    clientRooms[client.id] = roomName;
    client.emit("gameCode", roomName);

    state[roomName] = initGame();

    client.join(roomName);
    client.number = 1;
    client.emit("init", 1);
  }
});

function startGameInterval(roomName) {
  io.sockets.in(roomName).emit("startTimer");
  setTimeout(() => {
    const intervalId = setInterval(() => {
      const winner = gameLoop(state[roomName]);
      if (!winner) {
        emitGameState(roomName, state[roomName]);
      } else {
        emitGameOver(roomName, winner);
        state[roomName] = null;
        clearInterval(intervalId);
      }
    }, 1000 / FRAME_RATE);
  }, 7000);
}

function emitGameState(roomName, state) {
  io.sockets.in(roomName).emit("gameState", JSON.stringify(state));
}

function emitGameOver(roomName, winner) {
  io.sockets.in(roomName).emit("gameOver", JSON.stringify({ winner }));
}

app.listen(process.env.PORT || 3000, () => {
  console.log("server up");
});
