// Drawing the board on the canvas
const outlineColor = '#EEEEEE';
const hoverOutlineColor = '#FF0000';
const snakeColor = '#44F044';
const snakeDeadColor = '#F04444';

// Draws the whole board: the snake, the fruits, the outline of empty hexes, then the hovered hex
function drawBoard(ctx, layout, board, snake, hoveredHex) {
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
      } else if (board.hasFruit(hex)) {
        drawFruit(ctx, layout, hex, board.fruitAt(hex));
      } else {
        strokeHexagon(ctx, layout, hex, outlineColor);
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

function drawFruit(ctx, layout, hex, fruit) {
  const { x, y } = layout.hexToPixel(hex);
  ctx.drawImage(fruit.image, x + 2, y + 2, layout.hexRectangleWidth - 4, layout.hexRectangleHeight - 4);
}
