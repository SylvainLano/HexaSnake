// Drawing the board on the canvas
const outlineColor = '#EEEEEE';
const hoverOutlineColor = '#FF0000';
const snakeColor = '#44F044';
const snakeDeadColor = '#F04444';
const wallColor = '#505050';
// Opacity of the search's color on the hexes it explored, and on the path it found
const exploredTint = 0.15;
const pathTint = 0.45;

// Draws the whole board: the snake, the walls, the fruits, the outline of empty hexes, then the hovered hex.
// search, when given, is the last search to show: { explored, path } (sets of hex keys) and its color.
function drawBoard(ctx, layout, board, snake, hoveredHex, search) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.lineWidth = 1;
  // Fruits are 16 px pixel art: once drawn more than twice that size, enlarge them without blurring
  ctx.imageSmoothingEnabled = layout.hexRectangleWidth - 4 < 32;
  const snakeHexes = new Set(snake.body.map(hexKey));

  // Column by column: fruit images fill the rectangle around their hex, so they overlap
  // the corners of their neighbors, and the drawing order decides which one ends up on top
  for (let q = 0; q < board.size; q++) {
    for (let r = 0; r < board.size; r++) {
      const hex = { q, r };
      if (snakeHexes.has(hexKey(hex))) {
        fillHexagon(ctx, layout, hex, snake.isAlive ? snakeColor : snakeDeadColor);
      } else if (board.hasWall(hex)) {
        fillHexagon(ctx, layout, hex, wallColor);
      } else {
        // Under the fruit or the outline, a tint where the search went
        const key = hexKey(hex);
        const tint = !search ? 0 : search.path.has(key) ? pathTint : search.explored.has(key) ? exploredTint : 0;
        if (tint) {
          fillHexagon(ctx, layout, hex, withAlpha(search.color, tint));
        }
        if (board.hasFruit(hex)) {
          drawFruit(ctx, layout, hex, board.fruitAt(hex));
        } else {
          strokeHexagon(ctx, layout, hex, outlineColor);
        }
      }
    }
  }

  // A hovered fruit is drawn again (even under the snake), any other hovered hex gets a red outline
  if (hoveredHex) {
    if (board.hasFruit(hoveredHex)) {
      drawFruit(ctx, layout, hoveredHex, board.fruitAt(hoveredHex));
    } else {
      strokeHexagon(ctx, layout, hoveredHex, hoverOutlineColor);
    }
  }
}

function traceHexagon(ctx, layout, hex) {
  const { x, y } = layout.hexToPixel(hex);
  ctx.beginPath();
  ctx.moveTo(x + layout.hexRadius, y);
  ctx.lineTo(x + layout.hexRectangleWidth, y + layout.hexHeight);
  ctx.lineTo(x + layout.hexRectangleWidth, y + layout.hexHeight + layout.sideLength);
  ctx.lineTo(x + layout.hexRadius, y + layout.hexRectangleHeight);
  ctx.lineTo(x, y + layout.sideLength + layout.hexHeight);
  ctx.lineTo(x, y + layout.hexHeight);
  ctx.closePath();
}

function fillHexagon(ctx, layout, hex, color) {
  traceHexagon(ctx, layout, hex);
  ctx.fillStyle = color;
  ctx.fill();
}

function strokeHexagon(ctx, layout, hex, color) {
  traceHexagon(ctx, layout, hex);
  ctx.strokeStyle = color;
  ctx.stroke();
}

// '#B02020', 0.15 -> 'rgba(176, 32, 32, 0.15)'
function withAlpha(color, alpha) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function drawFruit(ctx, layout, hex, fruit) {
  const { x, y } = layout.hexToPixel(hex);
  ctx.drawImage(fruit.image, x + 2, y + 2, layout.hexRectangleWidth - 4, layout.hexRectangleHeight - 4);
}
