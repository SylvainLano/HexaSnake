// Game settings (the board size comes from the size slider)
const boardSide = 590; // pixels taken by the board on the canvas, padding excluded
const padding = 5;
const initialLength = 5;
const stepSpeeds = [1000, 750, 500, 375, 250, 200, 150, 100, 75, 50, 25]; // milliseconds per step, for each position of the speed slider

// The algorithms the snake can use to find its way to a fruit (see pathfinding.js), all compared at each step.
// shortName is for the comparison table, color for their curve; memory, for those who remember their last search.
const awareSearch = new AwareSearch();
const pathfinders = [
  { name: 'Dijkstra', shortName: 'Dij.', color: '#B02020', search: dijkstraSearch },
  { name: 'A*', shortName: 'A*', color: '#2A78D6', search: aStarSearch },
  { name: 'AW', shortName: 'AW', color: '#1BAF7A', search: (...args) => awareSearch.search(...args), memory: awareSearch }
];
// The measures of each search: the rows of the comparison table, and what the chart can follow
const comparisonRows = [
  { key: 'explored', label: 'Explored', value: (search) => search.explored },
  { key: 'path', label: 'Path', value: (search) => search.path },
  { key: 'time', label: 'Time (µs)', value: (search) => search.time }
];
const chartLength = 100; // steps shown by the chart

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
let pathfinderIndex = 0; // the algorithm the snake follows
let history = []; // the measures of the last steps, see recordSearches
let chartRow = comparisonRows[0]; // the measure the chart follows
let chartLogScale = false;
let chart;
let lastSearches = null; // the searches of the last step, null when there was no fruit to look for
let showExplored = false;
let searchOverlay = null; // what to paint on the board for the last search, see updateSearchOverlay

function draw() {
  drawBoard(ctx, layout, board, snake, hoveredHex, searchOverlay);
}

// The hexes explored by the last search of the selected algorithm and its path, when they are shown
function updateSearchOverlay() {
  const search = showExplored && lastSearches ? lastSearches[pathfinderIndex] : null;
  searchOverlay = search && {
    explored: new Set(search.explored.map(hexKey)),
    path: new Set((search.path || []).map(hexKey)),
    color: pathfinders[pathfinderIndex].color
  };
}

function toggleExplored() {
  showExplored = !showExplored;
  document.getElementById('explored_button').classList.toggle('selected', showExplored);
  updateSearchOverlay();
  draw();
}

// Method for each frame
function step() {
  if (!snake.isAlive || snake.listValidDirections(board).length == 0) {
    snake.isAlive = false;
    draw();
    return;
  }

  // Every algorithm looks for the nearest fruit, the snake follows the chosen one
  let path = null;
  let searches = null;
  if (board.hasAnyFruit()) {
    const goals = board.fruitHexes();
    const situation = { boardVersion: board.version, body: snake.body };
    searches = compareSearches(goals, situation);
    path = searches[pathfinderIndex].path;
    rememberSearches(searches, goals, situation);
  } else {
    forgetSearches();
  }
  recordSearches(searches);

  if (snake.move(board, path)) {
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

// Run every algorithm on the same situation and time them.
// A single search is too quick to time reliably, so each one is repeated for at least 2 ms.
function compareSearches(goals, situation) {
  const isWalkable = snake.walkableTest(board);
  return pathfinders.map((pathfinder) => {
    const startTime = performance.now();
    let result;
    let runs = 0;
    let elapsed;
    do {
      result = pathfinder.search(snake.position, goals, isWalkable, situation);
      runs++;
      elapsed = performance.now() - startTime;
    } while (elapsed < 2);
    return { path: result.path, explored: result.explored, searched: result.searched, time: elapsed / runs };
  });
}

// The algorithms with a memory keep what they found at this step
function rememberSearches(searches, goals, situation) {
  pathfinders.forEach((pathfinder, i) => {
    if (pathfinder.memory) {
      pathfinder.memory.remember(searches[i], goals, situation);
    }
  });
}

function forgetSearches() {
  for (const pathfinder of pathfinders) {
    if (pathfinder.memory) {
      pathfinder.memory.forget();
    }
  }
}

// Keep the measures of this step's searches (null when there was no fruit to look for),
// for the last chartLength steps, and show them in the table and the chart
function recordSearches(searches) {
  const measures = searches && searches.map((search) => ({
    explored: search.explored.length,
    path: search.path ? search.path.length : null,
    time: Math.round(search.time * 1000) // µs
  }));
  history.push(measures);
  if (history.length > chartLength) {
    history.shift();
  }
  showComparison(measures);
  updateChart();
  lastSearches = searches;
  updateSearchOverlay();
}

// Fill the comparison table with the last measures of each algorithm, or dashes when there was none
function showComparison(measures) {
  pathfinders.forEach((pathfinder, i) => {
    for (const row of comparisonRows) {
      const value = measures ? row.value(measures[i]) : '-';
      pathfinder.cells[row.key].textContent = value === null ? 'none' : value;
    }
  });
}

// Draw the history of the followed measure, one curve per algorithm
function updateChart() {
  const values = pathfinders.map((pathfinder, i) => history.map((measures) => measures ? chartRow.value(measures[i]) : null));
  chart.update(values, chartLength, chartLogScale);
}

function followRow(row) {
  chartRow = row;
  for (const other of comparisonRows) {
    other.element.classList.toggle('followed', other === row);
  }
  document.getElementById('chart_title').textContent = row.label;
  updateChart();
}

function setChartScale(logScale) {
  chartLogScale = logScale;
  document.getElementById('linear_toggle').classList.toggle('selected', !logScale);
  document.getElementById('log_toggle').classList.toggle('selected', logScale);
  updateChart();
}

function selectPathfinder(index) {
  pathfinderIndex = index;
  pathfinders.forEach((pathfinder, i) => {
    // Highlight its button and its column in the comparison table
    for (const element of [pathfinder.button, pathfinder.header, ...Object.values(pathfinder.cells)]) {
      element.classList.toggle('selected', i === index);
    }
  });
  // The board shows the search of the selected algorithm: when paused, switching shows both on the same situation
  updateSearchOverlay();
}

// Build the algorithm buttons and the comparison table (one column per algorithm) from the pathfinders list
function buildPathfinderControls() {
  const buttons = document.getElementById('algorithm_buttons');
  pathfinders.forEach((pathfinder, i) => {
    pathfinder.button = document.createElement('div');
    pathfinder.button.className = 'button';
    pathfinder.button.appendChild(document.createElement('p')).textContent = pathfinder.name;
    pathfinder.button.addEventListener('click', () => {
      selectPathfinder(i);
      draw();
    });
    buttons.appendChild(pathfinder.button);
  });

  const table = document.getElementById('comparison');
  const header = table.createTHead().insertRow();
  header.appendChild(document.createElement('th'));
  for (const pathfinder of pathfinders) {
    pathfinder.header = header.appendChild(document.createElement('th'));
    pathfinder.header.textContent = pathfinder.shortName;
  }
  // Clicking a row makes the chart follow that measure
  const body = table.createTBody();
  for (const row of comparisonRows) {
    row.element = body.insertRow();
    row.element.insertCell().textContent = row.label;
    row.element.addEventListener('click', () => followRow(row));
    for (const pathfinder of pathfinders) {
      pathfinder.cells = pathfinder.cells || {};
      pathfinder.cells[row.key] = row.element.insertCell();
    }
  }

  // The chart, its legend and its scale toggle
  chart = new ComparisonChart(document.getElementById('chart'), document.getElementById('chart_tooltip'), pathfinders);
  const legend = document.getElementById('chart_legend');
  for (const pathfinder of pathfinders) {
    const item = legend.appendChild(document.createElement('span'));
    item.className = 'legend_item';
    item.appendChild(document.createElement('span')).className = 'line_key';
    item.firstChild.style.background = pathfinder.color;
    item.appendChild(document.createTextNode(pathfinder.name));
  }
  document.getElementById('linear_toggle').addEventListener('click', () => setChartScale(false));
  document.getElementById('log_toggle').addEventListener('click', () => setChartScale(true));

  selectPathfinder(pathfinderIndex);
  setChartScale(chartLogScale);
  followRow(chartRow);
  showComparison(null);
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
  // Each game has its own curves
  history = [];
  showComparison(null);
  updateChart();
  lastSearches = null;
  forgetSearches();
  updateSearchOverlay();
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
document.getElementById('explored_button').addEventListener('click', toggleExplored);

buildPathfinderControls();
newGame();
startLoop();
