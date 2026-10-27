// Game settings (the board size comes from the size slider)
const boardSide = 590; // pixels taken by the board on the canvas, padding excluded
const padding = 5;
const initialLength = 5;
const stepSpeeds = [1000, 750, 500, 375, 250, 200, 150, 100, 75, 50, 25]; // milliseconds per step, for each position of the speed slider

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score_display');
const speedSlider = document.getElementById('speed_slider');
const sizeSlider = document.getElementById('size_slider');
const sizeDisplay = document.getElementById('size_display');
const sizeHint = document.getElementById('size_hint');

// Game state
let board;
let layout;
let snake;
let score = 0;
let stepSpeed = stepSpeeds[speedSlider.value];
let gameLoop = false;
let hoveredHex = null;

function draw() {
  drawBoard(ctx, layout, board, snake, hoveredHex);
}

// Method for each frame
function step() {
  if (!snake.isAlive || snake.listValidDirections(board).length == 0) {
    snake.isAlive = false;
    draw();
    return;
  }
  if (snake.move(board)) {
    board.removeFruit(snake.position);
    score += 20;
  }
  let scoreAddition = snake.length - initialLength;
  if (scoreAddition >= 1) {
    scoreAddition = Math.ceil(Math.log(scoreAddition));
  }
  score = Math.max(0, score + scoreAddition);
  scoreDisplay.textContent = score;
  updateSizeLock();
  draw();
}

// Empty board of the given size, with the canvas resized to fit it
function newBoard(size) {
  board = new Board(size);
  layout = new HexLayout(size, boardSide, padding);
  canvas.height = layout.canvasHeight;
  hoveredHex = null;
}

// New game on a board of the size chosen with the slider: no fruits, a new snake, score 0.
// The game loop is left as it is, running or paused.
function newGame() {
  const size = Number(sizeSlider.value);
  newBoard(size);
  // The head starts at 40% of the board, which is (12, 12) on a board of 30
  const start = Math.round(size * 0.4);
  snake = new Snake({ q: start, r: start }, initialLength);
  score = 0;
  scoreDisplay.textContent = score;
  sizeDisplay.textContent = size;
  updateSizeLock();
  draw();
}

function restart() {
  newGame();
  startLoop();
}

// The size can only change while the score is 0, so that a game in progress is never lost by accident
function updateSizeLock() {
  const locked = score !== 0;
  sizeSlider.disabled = locked;
  sizeHint.style.visibility = locked ? 'visible' : 'hidden';
}

// Remove every fruit from the board
function starve() {
  board.removeAllFruits();
  draw();
}

// Drop fruits on about 5% of the empty hexes
function gorge() {
  board.sprinkleFruits(0.05);
  draw();
}

function startLoop() {
  stopLoop();
  gameLoop = setInterval(step, stepSpeed);
}

function stopLoop() {
  if (gameLoop !== false) {
    clearInterval(gameLoop);
  }
  gameLoop = false;
}

function togglePause() {
  if (gameLoop === false) {
    startLoop();
  } else {
    stopLoop();
  }
}

// Clicking a hex adds a fruit there, or removes the one it holds
canvas.addEventListener('click', function(event) {
  const hex = layout.pixelToHex(event.offsetX, event.offsetY);
  if (hex) {
    board.toggleFruit(hex);
    draw();
  }
});

// Remember the hovered hex so the highlight survives the next frame
canvas.addEventListener('mousemove', function(event) {
  hoveredHex = layout.pixelToHex(event.offsetX, event.offsetY);
  draw();
});

canvas.addEventListener('mouseleave', function() {
  hoveredHex = null;
  draw();
});

speedSlider.addEventListener('input', function() {
  stepSpeed = stepSpeeds[speedSlider.value];
  // Apply the new speed without unpausing the game
  if (gameLoop !== false) {
    startLoop();
  }
});

sizeSlider.addEventListener('input', newGame);

document.getElementById('starve_button').addEventListener('click', starve);
document.getElementById('gorge_button').addEventListener('click', gorge);
document.getElementById('pause_button').addEventListener('click', togglePause);
document.getElementById('restart_button').addEventListener('click', restart);

restart();
