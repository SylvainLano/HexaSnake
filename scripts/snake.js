// The snake: its body is a list of hexes from head to tail.
// It heads for the nearest fruit, wanders when none can be reached, and gets shorter with hunger.
// It dies when it has nowhere to go: walls, the borders and its own body block its way.
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

  // Check if the given hex is part of the snake's body
  occupies(hex) {
    return this.body.some((segment) => sameHex(segment, hex));
  }

  // Returns a function telling whether a hex can be entered: inside the board, not a wall and not part of the body
  walkableTest(board) {
    const occupied = new Set(this.body.map(hexKey));
    return (hex) => board.isInside(hex) && !board.hasWall(hex) && !occupied.has(hexKey(hex));
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

  // method to move the snake one step along the path to a fruit found by a search (see pathfinding.js)
  // returns true if a fruit is eaten
  move(board, path) {
    if (path) {
      return this.moveTo(path[0], board);
    }

    // No fruits available to eat, move the snake randomly
    this.moveRandomly(board);
    return false;
  }

  // method to move the snake randomly, towards the farthest hex it can reach
  moveRandomly(board) {
    const step = this.wanderStep(board);
    if (step) {
      this.moveTo(step, board);
    } else {
      this.isAlive = false;
    }
  }

  // The first step towards the farthest hex it can reach, or null if it can't move
  wanderStep(board) {
    const availableDirections = this.listValidDirections(board);

    // If there are available directions, choose one randomly
    if (availableDirections.length === 0) {
      return null;
    }
    const preferedDirection = Math.floor(Math.random() * availableDirections.length);
    return findFarthestStep(this.position, this.walkableTest(board), preferedDirection);
  }

  // Smart mode: the way to follow instead of fruitPath (the path to the nearest fruit, or null to wander).
  // The snake only takes a way if, at its end, its head can still get next to its tail: by following its tail,
  // which frees the way in front of it, it can then always get out. Otherwise it takes a single step after which
  // that is still true, towards its tail if it can (eating a fruit on the way would stop the tail for a step),
  // and only takes the risk when no step is safe anymore.
  smartPath(board, fruitPath) {
    let way = fruitPath;
    if (!way) {
      const step = this.wanderStep(board);
      if (!step) {
        return null;
      }
      way = [step];
    }
    if (this.canReachTailAfter(board, way, fruitPath !== null)) {
      return way;
    }
    const tailPath = this.pathToTail(board, this.body);
    const steps = (tailPath ? [tailPath[0]] : []).concat(this.listValidDirections(board).map((direction) => hexNeighbor(this.position, direction)));
    const safeStep = steps.find((step) => this.canReachTailAfter(board, [step], board.hasFruit(step)));
    return safeStep ? [safeStep] : way;
  }

  // Whether the head could still reach the tail once the snake has followed the path (and eaten its fruit)
  canReachTailAfter(board, path, eats) {
    const length = this.body.length + (eats ? 1 : 0);
    const body = [...path].reverse().concat(this.body).slice(0, length);
    return this.pathToTail(board, body) !== null;
  }

  // A way from the head of this body to a free hex next to its tail, or null.
  // The head can't enter the tail's hex, which is still part of the body when it moves; but once next to the tail,
  // it can follow it, since the tail frees a hex in front of the head at every step.
  pathToTail(board, body) {
    const covered = new Set(body.map(hexKey));
    const isWalkable = (hex) => board.isInside(hex) && !board.hasWall(hex) && !covered.has(hexKey(hex));
    const tail = body[body.length - 1];
    const besideTail = [0, 1, 2, 3, 4, 5].map((direction) => hexNeighbor(tail, direction)).filter(isWalkable);
    return besideTail.length > 0 ? dijkstraSearch(body[0], besideTail, isWalkable).path : null;
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
