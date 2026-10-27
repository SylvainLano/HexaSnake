// The snake: its body is a list of hexes from head to tail.
// It heads for the nearest fruit, wanders when none can be reached, and gets shorter with hunger.
class Snake {
  constructor(head, length) {
    this.position = { q: head.q, r: head.r };
    this.length = length;
    this.body = [];
    this.isAlive = true;
    this.stepToConsume = 0;
    this.numberOfStepToConsume = 24;
    this.minLength = 2;

    // Create the body
    for (let i = 0; i < length; i++) {
      this.body.push({ q: head.q - i, r: head.r });
    }
  }

  // Returns a function telling whether a hex can be entered: inside the board and not part of the body
  walkableTest(board) {
    const occupied = new Set(this.body.map(hexKey));
    return (hex) => board.isInside(hex) && !occupied.has(hexKey(hex));
  }

  // method to list available directions to move to
  listValidDirections(board) {
    const isWalkable = this.walkableTest(board);
    const availableDirections = [];
    for (let direction = 0; direction < 6; direction++) {
      if (isWalkable(hexNeighbor(this.position, direction))) {
        availableDirections.push(direction);
      }
    }
    return availableDirections;
  }

  // method to move the snake one step, towards the nearest fruit if one can be reached
  // returns true if a fruit is eaten
  move(board) {
    if (board.hasAnyFruit()) {
      const path = findShortestPath(this.position, (hex) => board.hasFruit(hex), this.walkableTest(board));
      if (path) {
        return this.moveTo(path[0], board);
      }
    }

    // No fruits available to eat, move the snake randomly
    this.moveRandomly(board);
    return false;
  }

  // method to move the snake randomly, towards the farthest hex it can reach
  moveRandomly(board) {
    const availableDirections = this.listValidDirections(board);

    // If there are available directions, choose one randomly
    if (availableDirections.length > 0) {
      const preferedDirection = Math.floor(Math.random() * availableDirections.length);
      this.moveTo(findFarthestStep(this.position, this.walkableTest(board), preferedDirection), board);
    } else {
      this.isAlive = false;
    }
  }

  // method to move the head to a neighboring hex, eating the fruit there if any
  // returns true if a fruit is eaten
  moveTo(hex, board) {
    this.position = hex;
    this.addHunger();
    // Update the snake's body (add a new head segment)
    this.body.unshift({ q: hex.q, r: hex.r });
    if (board.hasFruit(hex)) {
      this.length++;
      return true;
    }
    this.body.pop();
    return false;
  }

  // method to simulate the consumption of energy (snake gets shorter)
  addHunger() {
    this.stepToConsume++;
    if (this.stepToConsume >= this.numberOfStepToConsume && this.length > this.minLength) {
      this.length--;
      this.body.pop();
      this.stepToConsume = 0;
    }
  }
}
