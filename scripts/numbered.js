// AW#: exactly AW (see pathfinding.js), same decisions and same results, but written with numbered cells.
//
// Hex (q, r) is cell number r * size + q. Instead of building a text key such as "4,2" for every hex
// it looks at and looking it up in a Map, the search reads and writes plain lists of numbers
// (typed arrays) at that cell's number. Its neighbors are found with a few additions.
//
// To be compared fairly with AW, it looks at the hexes in the very same order: same directions,
// and the same heap with the same way of breaking ties.

// Where the snake can't go, as numbers: built once per step, like the isWalkable test of the other searches.
// blocked[cell] is 1 for walls and for the snake's body, covered[cell] is 1 for the body only.
function numberCells(board, body) {
  const size = board.size;
  const blocked = new Uint8Array(size * size);
  const covered = new Uint8Array(size * size);
  for (let r = 0; r < size; r++) {
    for (let q = 0; q < size; q++) {
      if (board.cells[r][q].wall) {
        blocked[r * size + q] = 1;
      }
    }
  }
  for (const segment of body) {
    blocked[segment.r * size + segment.q] = 1;
    covered[segment.r * size + segment.q] = 1;
  }
  return { size, blocked, covered };
}

// Column and row offsets of the 6 neighbors, in the same order as hexNeighbor, for even and odd rows
const evenRowOffsets = [[0, -1], [1, 0], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
const oddRowOffsets = [[1, -1], [1, 0], [1, 1], [0, 1], [-1, 0], [0, -1]];

// Number of the neighbor of a cell in a direction, or -1 outside the board
function neighborCell(cell, direction, size) {
  const q = cell % size;
  const r = (cell - q) / size;
  const [dq, dr] = (r % 2 === 0 ? evenRowOffsets : oddRowOffsets)[direction];
  const nq = q + dq;
  const nr = r + dr;
  return nq < 0 || nq >= size || nr < 0 || nr >= size ? -1 : nr * size + nq;
}

function cellToHex(cell, size) {
  const q = cell % size;
  return { q, r: (cell - q) / size };
}

class NumberedAwareSearch {
  constructor() {
    this.memory = null;
    this.size = 0;
  }

  forget() {
    this.memory = null;
  }

  // The lists a search needs, kept from one search to the next as long as the board size doesn't change
  prepare(size) {
    if (this.size !== size) {
      const cells = size * size;
      this.size = size;
      this.steps = new Int32Array(cells);
      this.previous = new Int32Array(cells);
      this.isGoal = new Uint8Array(cells);
      this.exploredCells = new Int32Array(cells);
      // A cell can be pushed once per neighbor that finds a shorter way to it
      this.heap = new NumberHeap(6 * cells + 1);
    }
  }

  search(start, goals, isWalkable, situation) {
    if (this.canKeep(start, situation) && this.memory.cells.every((cell) => !situation.grid.blocked[cell])) {
      return { path: this.memory.path, explored: this.memory.path.slice(), searched: false };
    }
    return { ...this.aStar(start, goals, situation.grid), searched: true };
  }

  // The same A* as aStarSearch, on numbers
  aStar(start, goals, grid) {
    const size = grid.size;
    this.prepare(size);
    const { steps, previous, isGoal, exploredCells, heap } = this;
    steps.fill(-1); // -1: not reached yet
    isGoal.fill(0);
    heap.clear();

    const goalCubes = goals.map(offsetToCube);
    for (const goal of goals) {
      isGoal[goal.r * size + goal.q] = 1;
    }
    const estimate = (cell) => {
      const q = cell % size;
      const r = (cell - q) / size;
      const x = q - (r - (r & 1)) / 2;
      const y = -x - r;
      let nearest = Infinity;
      for (const goal of goalCubes) {
        nearest = Math.min(nearest, Math.max(Math.abs(x - goal.x), Math.abs(y - goal.y), Math.abs(r - goal.z)));
      }
      return nearest;
    };

    const startCell = start.r * size + start.q;
    steps[startCell] = 0;
    let exploredCount = 0;
    exploredCells[exploredCount++] = startCell;
    const startEstimate = estimate(startCell);
    heap.push(startEstimate * 65536 + startEstimate, startCell, 0);

    while (heap.size > 0) {
      heap.pop();
      const current = heap.poppedCell;
      const currentSteps = heap.poppedSteps;
      // A cell can be in the heap several times if a shorter way to it was found later: skip the old entries
      if (currentSteps > steps[current]) {
        continue;
      }

      const q = current % size;
      const r = (current - q) / size;
      const offsets = r % 2 === 0 ? evenRowOffsets : oddRowOffsets;
      for (let direction = 0; direction < 6; direction++) {
        const nq = q + offsets[direction][0];
        const nr = r + offsets[direction][1];
        if (nq < 0 || nq >= size || nr < 0 || nr >= size) {
          continue;
        }
        const neighbor = nr * size + nq;
        const neighborSteps = currentSteps + 1;
        if (grid.blocked[neighbor] || (steps[neighbor] !== -1 && neighborSteps >= steps[neighbor])) {
          continue;
        }
        if (steps[neighbor] === -1) {
          exploredCells[exploredCount++] = neighbor;
        }
        steps[neighbor] = neighborSteps;
        previous[neighbor] = current;

        if (isGoal[neighbor]) {
          const path = [];
          for (let cell = neighbor; cell !== startCell; cell = previous[cell]) {
            path.unshift(cellToHex(cell, size));
          }
          return { path, explored: this.exploredHexes(exploredCount, size) };
        }

        // Ordered by steps + estimate, then by estimate, packed in one number (estimates stay far below 65536)
        const neighborEstimate = estimate(neighbor);
        heap.push((neighborSteps + neighborEstimate) * 65536 + neighborEstimate, neighbor, neighborSteps);
      }
    }

    return { path: null, explored: this.exploredHexes(exploredCount, size) };
  }

  exploredHexes(count, size) {
    const hexes = [];
    for (let i = 0; i < count; i++) {
      hexes.push(cellToHex(this.exploredCells[i], size));
    }
    return hexes;
  }

  canKeep(start, situation) {
    const memory = this.memory;
    return memory !== null &&
      memory.path.length > 0 &&
      memory.boardVersion === situation.boardVersion &&
      memory.size === situation.grid.size &&
      memory.start === start.r * memory.size + start.q &&
      !(memory.detour && this.freedNearExplored(situation.grid));
  }

  // Whether a cell the body left since the last step touches the cells explored by the last A* search
  freedNearExplored(grid) {
    const { body, explored, size } = this.memory;
    for (const cell of body) {
      if (grid.covered[cell]) {
        continue;
      }
      for (let direction = 0; direction < 6; direction++) {
        const neighbor = neighborCell(cell, direction, size);
        if (neighbor >= 0 && explored[neighbor]) {
          return true;
        }
      }
    }
    return false;
  }

  // Keep the rest of the way, for when the head is on the first step of this path
  remember(result, goals, situation) {
    if (!result.path) {
      this.forget();
      return;
    }
    const size = situation.grid.size;
    const [next, ...rest] = result.path;
    const nearest = Math.min(...goals.map((goal) => hexDistance(next, goal)));
    let explored = this.memory && this.memory.explored;
    if (result.searched) {
      explored = new Uint8Array(size * size);
      for (const hex of result.explored) {
        explored[hex.r * size + hex.q] = 1;
      }
    }
    this.memory = {
      size,
      start: next.r * size + next.q,
      path: rest,
      cells: rest.map((hex) => hex.r * size + hex.q),
      detour: rest.length > nearest,
      boardVersion: situation.boardVersion,
      body: situation.body.map((segment) => segment.r * size + segment.q),
      explored // the cells of the last real search, kept while the path is
    };
  }
}

// The same binary heap as MinHeap (pathfinding.js), on numbers: each item is a priority, a cell and its steps.
// pop() leaves the cell and steps of the smallest item in poppedCell and poppedSteps.
class NumberHeap {
  constructor(capacity) {
    this.priorities = new Float64Array(capacity);
    this.cells = new Int32Array(capacity);
    this.steps = new Int32Array(capacity);
    this.size = 0;
  }

  clear() {
    this.size = 0;
  }

  // With a temporary variable rather than [a, b] = [b, a], which builds small arrays at every swap
  swap(i, j) {
    const { priorities, cells, steps } = this;
    let kept = priorities[i];
    priorities[i] = priorities[j];
    priorities[j] = kept;
    kept = cells[i];
    cells[i] = cells[j];
    cells[j] = kept;
    kept = steps[i];
    steps[i] = steps[j];
    steps[j] = kept;
  }

  push(priority, cell, steps) {
    let i = this.size++;
    this.priorities[i] = priority;
    this.cells[i] = cell;
    this.steps[i] = steps;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.priorities[i] - this.priorities[parent] >= 0) {
        break;
      }
      this.swap(i, parent);
      i = parent;
    }
  }

  pop() {
    this.poppedCell = this.cells[0];
    this.poppedSteps = this.steps[0];
    const last = --this.size;
    if (last > 0) {
      this.priorities[0] = this.priorities[last];
      this.cells[0] = this.cells[last];
      this.steps[0] = this.steps[last];
      let i = 0;
      while (true) {
        const left = 2 * i + 1;
        const right = left + 1;
        let smallest = i;
        if (left < this.size && this.priorities[left] - this.priorities[smallest] < 0) {
          smallest = left;
        }
        if (right < this.size && this.priorities[right] - this.priorities[smallest] < 0) {
          smallest = right;
        }
        if (smallest === i) {
          break;
        }
        this.swap(i, smallest);
        i = smallest;
      }
    }
  }
}
