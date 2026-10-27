// Hexagonal grid geometry.
//
// Hexes are pointy-top and use offset coordinates: q is the column, r is the row, and odd rows
// are shifted half a hex to the right (the "odd-r" layout). Despite the letters, these are NOT
// axial coordinates: distance formulas for axial or cube coordinates don't apply to them directly.

function hexKey(hex) {
  return `${hex.q},${hex.r}`;
}

function sameHex(hex1, hex2) {
  return hex1.q === hex2.q && hex1.r === hex2.r;
}

// Cube coordinates of a hex: x + y + z = 0, and each step changes two of them by 1.
// See https://www.redblobgames.com/grids/hexagons/#conversions-offset ("odd-r")
function offsetToCube(hex) {
  const x = hex.q - (hex.r - (hex.r & 1)) / 2;
  const z = hex.r;
  return { x, y: -x - z, z };
}

function cubeDistance(a, b) {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.z - b.z));
}

// Number of steps between two hexes on an empty board (walls can only make the real path longer)
function hexDistance(hex1, hex2) {
  return cubeDistance(offsetToCube(hex1), offsetToCube(hex2));
}

// Function to calculate the coordinate of the next hex in a given direction (0 to 5, clockwise)
function hexNeighbor(hex, direction) {
  const { q, r } = hex;
  const isEvenRow = r % 2 === 0;
  switch (direction) {
    case 0: // Move up-right
      return { q: isEvenRow ? q : q + 1, r: r - 1 };
    case 1: // Move right
      return { q: q + 1, r: r };
    case 2: // Move down-right
      return { q: isEvenRow ? q : q + 1, r: r + 1 };
    case 3: // Move down-left
      return { q: isEvenRow ? q - 1 : q, r: r + 1 };
    case 4: // Move left
      return { q: q - 1, r: r };
    case 5: // Move up-left
      return { q: isEvenRow ? q - 1 : q, r: r - 1 };
    default:
      return { q, r };
  }
}

// Pixel layout of a size x size board, fitted in a square of boardSide pixels with padding around it
class HexLayout {
  constructor(size, boardSide, padding) {
    this.size = size;
    this.padding = padding;
    this.sideLength = boardSide / (size + .5) / Math.sqrt(3);
    this.hexHeight = this.sideLength / 2; // height of the pointy top (and bottom) of a hex
    this.hexRadius = this.sideLength * Math.sqrt(3) / 2; // half the width of a hex
    this.hexRectangleWidth = 2 * this.hexRadius;
    this.hexRectangleHeight = 2 * this.sideLength;
    this.rowStep = this.sideLength + this.hexHeight; // vertical distance between two rows
    this.canvasHeight = (size - 1) * this.rowStep + this.hexRectangleHeight + 2 * padding;
  }

  // Top-left corner of the rectangle around a hex
  hexToPixel(hex) {
    return {
      x: hex.q * this.hexRectangleWidth + (hex.r & 1) * this.hexRadius + this.padding,
      y: hex.r * this.rowStep + this.padding
    };
  }

  hexCenter(hex) {
    const corner = this.hexToPixel(hex);
    return { x: corner.x + this.hexRadius, y: corner.y + this.sideLength };
  }

  // Hex under a pixel, or null outside the board.
  // The hex containing a point is the one whose center is the nearest, so we only compare
  // the nearest center of the row the point falls in and of the row above (their pointy parts overlap).
  pixelToHex(x, y) {
    const row = Math.floor((y - this.padding) / this.rowStep);
    let nearest = null;
    let nearestDistance = Infinity;

    for (const r of [row - 1, row]) {
      const q = Math.round((x - this.padding - (r & 1) * this.hexRadius - this.hexRadius) / this.hexRectangleWidth);
      const center = this.hexCenter({ q, r });
      const distance = (x - center.x) ** 2 + (y - center.y) ** 2;
      if (distance < nearestDistance) {
        nearest = { q, r };
        nearestDistance = distance;
      }
    }

    if (nearest.q < 0 || nearest.q >= this.size || nearest.r < 0 || nearest.r >= this.size) {
      return null;
    }
    return nearest;
  }
}
