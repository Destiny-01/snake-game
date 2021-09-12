const BG_COLOR = "#231f20";
const SNAKE_COLOR = "#c2c2c2";
const FOOD_COLOR = "#e66916";

const socket = io("https://desolate-ocean-06044.herokuapp.com/");
socket.on("init", handleInit);
socket.on("gameState", handlegameState);
socket.on("gameOver", handlegameOver);
socket.on("startTimer", startTimer);
socket.on("gameCode", handlegameCode);
socket.on("unknownGame", handleunknownGame);
socket.on("TooManyPlayers", handleTooManyPlayers);

const gameScreen = document.getElementById("gameScreen");
const initialScreen = document.getElementById("initialScreen");
const newGameBtn = document.getElementById("newGameBtn");
const joinGameBtn = document.getElementById("joinGameBtn");
const gameCodeInput = document.getElementById("gameCodeInput");
const gameCodeDisplay = document.getElementById("gameCodeDisplay");

newGameBtn.addEventListener("click", newGame);
joinGameBtn.addEventListener("click", joinGame);

function newGame() {
  socket.emit("newGame");

  init();
}

function joinGame() {
  const gameCode = gameCodeInput.value;
  socket.emit("joinGame", gameCode);

  init();
}

let canvas, ctx;
let playerNumber;
let gameActive = false;

function init() {
  initialScreen.style.display = "none";
  gameScreen.style.display = "block";

  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  canvas.width = canvas.height = 600;

  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  document.addEventListener("keydown", keydown);
  gameActive = true;
}

function keydown(e) {
  socket.emit("keydown", e.keyCode);
}

function paintGame(state) {
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const food = state.food;
  const gridSize = state.gridSize;
  const size = canvas.width / gridSize;

  ctx.fillStyle = FOOD_COLOR;
  ctx.fillRect(food.x * size, food.y * size, size, size);

  paintPlayer(state.players[0], size, SNAKE_COLOR);
  paintPlayer(state.players[1], size, "red");
}

function paintPlayer(playerState, size, color) {
  const snake = playerState.snake;

  ctx.fillStyle = color;
  for (let cell of snake) {
    ctx.fillRect(cell.x * size, cell.y * size, size, size);
  }
}

function handleInit(number) {
  playerNumber = number;
}

function handlegameState(gameState) {
  if (!gameActive) {
    return;
  }
  gameState = JSON.parse(gameState);
  requestAnimationFrame(() => paintGame(gameState));
}

function handlegameOver(data) {
  data = JSON.parse(data);
  if (data.winner == playerNumber) {
    alert("You win!");
  } else {
    alert("You lose.");
  }
  gameActive = false;
}

function handlegameCode(gameCode) {
  gameCodeDisplay.innerText = gameCode;
}

function handleunknownGame() {
  reset();
  alert("unknown game code");
}

function handleTooManyPlayers() {
  reset();
  alert("this game is already in progress");
}

function reset() {
  playerNumber = null;
  gameCodeInput.value = "";
  gameCodeDisplay.innerText = "";
  initialScreen.style.display = "block";
  gameScreen.style.display = "none";
}

function formatTime(time) {
  let seconds = time % 60;

  return `${seconds}`;
}

const TIME_LIMIT = 6;

let timePassed = 0;
let timeLeft = TIME_LIMIT;

function startTimer() {
  timerInterval = setInterval(() => {
    timePassed = timePassed += 1;
    timeLeft = TIME_LIMIT - timePassed;

    document.getElementById("timer").innerHTML = `Game starts in ${formatTime(
      timeLeft
    )}`;
    document.getElementById("wait").style.display = "none";

    if (timeLeft === 0) {
      clearInterval(timerInterval);
    }
  }, 1000);
}
