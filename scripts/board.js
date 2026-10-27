// The board: a size x size grid of hexes (see hex.js for coordinates), each one empty or holding a fruit.
// It is the only place that knows where the fruits are.
class Board {
  constructor(size) {
    this.size = size;
    this.fruitCount = 0;
    this.cells = []; // cells[r][q]

    for (let r = 0; r < size; r++) {
      const row = [];
      for (let q = 0; q < size; q++) {
        row.push({ fruit: null });
      }
      this.cells.push(row);
    }
  }

  isInside(hex) {
    return hex.q >= 0 && hex.q < this.size && hex.r >= 0 && hex.r < this.size;
  }

  // The fruit on a hex (an entry of possibleFruits), or null
  fruitAt(hex) {
    return this.isInside(hex) ? this.cells[hex.r][hex.q].fruit : null;
  }

  hasFruit(hex) {
    return this.fruitAt(hex) !== null;
  }

  hasAnyFruit() {
    return this.fruitCount > 0;
  }

  addFruit(hex) {
    if (this.isInside(hex) && !this.hasFruit(hex)) {
      this.cells[hex.r][hex.q].fruit = getRandomFruit();
      this.fruitCount++;
    }
  }

  removeFruit(hex) {
    if (this.hasFruit(hex)) {
      this.cells[hex.r][hex.q].fruit = null;
      this.fruitCount--;
    }
  }

  toggleFruit(hex) {
    if (this.hasFruit(hex)) {
      this.removeFruit(hex);
    } else {
      this.addFruit(hex);
    }
  }

  removeAllFruits() {
    for (const row of this.cells) {
      for (const cell of row) {
        cell.fruit = null;
      }
    }
    this.fruitCount = 0;
  }

  // Give every empty hex the given chance of getting a fruit
  sprinkleFruits(chance) {
    for (let r = 0; r < this.size; r++) {
      for (let q = 0; q < this.size; q++) {
        const num = Math.random();
        if (num < chance && !this.hasFruit({ q, r })) {
          this.addFruit({ q, r });
        }
      }
    }
  }
}
