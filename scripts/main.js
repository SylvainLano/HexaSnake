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
let stroke = null; // what the mouse is drawing while a button is held, see startStroke

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

// Start over on the current board: no fruits, a new snake, score 0.
// The walls are kept, except under the new snake.
function resetGame() {
  board.removeAllFruits();
  // The head starts at 40% of the board, which is (12, 12) on a board of 30
  const start = Math.round(board.size * 0.4);
  snake = new Snake({ q: start, r: start }, initialLength);
  for (const segment of snake.body) {
    board.removeWall(segment);
  }
  score = 0;
  scoreDisplay.textContent = score;
  sizeDisplay.textContent = board.size;
  updateSizeLock();
  draw();
}

// New game on an empty board of the size chosen with the slider.
// The game loop is left as it is, running or paused.
function newGame() {
  newBoard(Number(sizeSlider.value));
  resetGame();
}

function restart() {
  resetGame();
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

function clearWalls() {
  board.removeAllWalls();
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

// Drawing with the mouse: the left button puts or removes fruits, the right button walls,
// on every hex the mouse goes over until the button is released.
// The first hex decides: if it already holds what the button puts, the stroke removes it, otherwise it adds it.
function startStroke(event) {
  const hex = layout.pixelToHex(event.offsetX, event.offsetY);
  if (!hex || (event.button !== 0 && event.button !== 2)) {
    return;
  }
  const kind = event.button === 0 ? 'fruit' : 'wall';
  const adding = kind === 'fruit' ? !board.hasFruit(hex) : !board.hasWall(hex);
  stroke = { kind, adding, x: event.offsetX, y: event.offsetY };
  applyStroke(hex);
}

function applyStroke(hex) {
  if (!hex) {
    return;
  }
  if (stroke.kind === 'fruit') {
    if (stroke.adding) {
      board.addFruit(hex);
    } else {
      board.removeFruit(hex);
    }
  } else if (stroke.adding) {
    // Walls are never put on the snake
    if (!snake.occupies(hex)) {
      board.addWall(hex);
    }
  } else {
    board.removeWall(hex);
  }
}

// Apply the stroke along the mouse movement, so that a quick drag doesn't skip hexes
function continueStroke(event) {
  const dx = event.offsetX - stroke.x;
  const dy = event.offsetY - stroke.y;
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / (layout.hexRadius / 2)));
  for (let i = 1; i <= steps; i++) {
    applyStroke(layout.pixelToHex(stroke.x + dx * i / steps, stroke.y + dy * i / steps));
  }
  stroke.x = event.offsetX;
  stroke.y = event.offsetY;
}

canvas.addEventListener('mousedown', function(event) {
  startStroke(event);
  draw();
});

// Remember the hovered hex so the highlight survives the next frame
canvas.addEventListener('mousemove', function(event) {
  hoveredHex = layout.pixelToHex(event.offsetX, event.offsetY);
  if (stroke) {
    continueStroke(event);
  }
  draw();
});

canvas.addEventListener('mouseleave', function() {
  hoveredHex = null;
  stroke = null;
  draw();
});

window.addEventListener('mouseup', function() {
  stroke = null;
});

// The right button builds walls, so no context menu on the board
canvas.addEventListener('contextmenu', function(event) {
  event.preventDefault();
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
document.getElementById('clear_walls_button').addEventListener('click', clearWalls);
document.getElementById('pause_button').addEventListener('click', togglePause);
document.getElementById('restart_button').addEventListener('click', restart);

newGame();
startLoop();
