// Pathfinding on the hex grid, from the snake's head to the nearest of several goals (the fruits).
// The searches only know about hexes: isWalkable(hex) says whether a hex can be entered.
//
// Each search returns { path, explored }:
// - path goes from the first step to the goal it found, or is null if no goal can be reached;
// - explored lists every hex the search looked at, start included.
//
// Both searches stop as soon as they see a goal next to the hex they are expanding. Every step costs 1,
// so the goal found this way is always one of the nearest: they find paths of the same length, and only
// differ in the order in which they look at the hexes, so in how many hexes they explore.

// Every step costs 1 on this board, so a breadth-first search finds the same shortest paths as
// Dijkstra's algorithm, and looks at the hexes in the same order: this is our Dijkstra.
function dijkstraSearch(start, goals, isWalkable) {
  const goalKeys = new Set(goals.map(hexKey));
  const previous = new Map([[hexKey(start), null]]);
  const explored = [start];
  const queue = [start];

  for (let i = 0; i < queue.length; i++) {
    const current = queue[i];

    for (let dir = 0; dir < 6; dir++) {
      const neighbor = hexNeighbor(current, dir);
      const neighborKey = hexKey(neighbor);

      if (previous.has(neighborKey) || !isWalkable(neighbor)) {
        continue;
      }
      previous.set(neighborKey, current);
      explored.push(neighbor);

      if (goalKeys.has(neighborKey)) {
        return { path: buildPath(previous, start, neighbor), explored };
      }

      queue.push(neighbor);
    }
  }

  return { path: null, explored };
}

// A*: expands first the hexes that seem closest to a goal, by the steps already taken plus the
// hex distance to the nearest goal. That distance ignores walls, so it never overestimates the
// remaining steps and the paths found are still the shortest ones.
// Between hexes that seem equally good, the one closest to a goal goes first, so that A* heads
// straight for the fruit instead of widening its search among equivalent paths.
function aStarSearch(start, goals, isWalkable) {
  const goalKeys = new Set(goals.map(hexKey));
  const goalCubes = goals.map(offsetToCube);
  const estimate = (hex) => {
    const cube = offsetToCube(hex);
    let nearest = Infinity;
    for (const goalCube of goalCubes) {
      nearest = Math.min(nearest, cubeDistance(cube, goalCube));
    }
    return nearest;
  };
  const previous = new Map([[hexKey(start), null]]);
  const steps = new Map([[hexKey(start), 0]]); // fewest steps found so far from start to each hex
  const explored = [start];
  const open = new MinHeap((a, b) => (a.steps + a.estimate) - (b.steps + b.estimate) || a.estimate - b.estimate);
  open.push({ hex: start, steps: 0, estimate: estimate(start) });

  while (open.size > 0) {
    const current = open.pop();
    // A hex can be in the heap several times if a shorter way to it was found later: skip the old entries
    if (current.steps > steps.get(hexKey(current.hex))) {
      continue;
    }

    for (let dir = 0; dir < 6; dir++) {
      const neighbor = hexNeighbor(current.hex, dir);
      const neighborKey = hexKey(neighbor);
      const neighborSteps = current.steps + 1;

      if (!isWalkable(neighbor) || neighborSteps >= (steps.get(neighborKey) ?? Infinity)) {
        continue;
      }
      if (!steps.has(neighborKey)) {
        explored.push(neighbor);
      }
      steps.set(neighborKey, neighborSteps);
      previous.set(neighborKey, current.hex);

      if (goalKeys.has(neighborKey)) {
        return { path: buildPath(previous, start, neighbor), explored };
      }

      open.push({ hex: neighbor, steps: neighborSteps, estimate: estimate(neighbor) });
    }
  }

  return { path: null, explored };
}

// Construct the path to end by following previous steps back to start
function buildPath(previous, start, end) {
  const path = [];
  for (let step = end; step !== start; step = previous.get(hexKey(step))) {
    path.unshift(step);
  }
  return path;
}

// Minimal binary heap: pop() always returns the smallest item according to compare
class MinHeap {
  constructor(compare) {
    this.items = [];
    this.compare = compare;
  }

  get size() {
    return this.items.length;
  }

  push(item) {
    const items = this.items;
    items.push(item);
    let i = items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.compare(items[i], items[parent]) >= 0) {
        break;
      }
      [items[i], items[parent]] = [items[parent], items[i]];
      i = parent;
    }
  }

  pop() {
    const items = this.items;
    const top = items[0];
    const last = items.pop();
    if (items.length > 0) {
      items[0] = last;
      let i = 0;
      while (true) {
        const left = 2 * i + 1;
        const right = left + 1;
        let smallest = i;
        if (left < items.length && this.compare(items[left], items[smallest]) < 0) {
          smallest = left;
        }
        if (right < items.length && this.compare(items[right], items[smallest]) < 0) {
          smallest = right;
        }
        if (smallest === i) {
          break;
        }
        [items[i], items[smallest]] = [items[smallest], items[i]];
        i = smallest;
      }
    }
    return top;
  }
}

// Breadth-first search over every reachable hex, to find the first step towards the farthest one
// (the first one found at the greatest distance). Returns null if no neighbor can be entered.
// startingDirection rotates the order in which neighbors are tried, so ties are broken differently.
function findFarthestStep(start, isWalkable, startingDirection) {
  const reached = new Map([[hexKey(start), { distance: 0, firstStep: null }]]);
  const queue = [start];
  let farthestStep = null;
  let maxDistance = 0;

  for (let i = 0; i < queue.length; i++) {
    const current = queue[i];
    const currentInfo = reached.get(hexKey(current));

    for (let dir = 0; dir < 6; dir++) {
      const neighbor = hexNeighbor(current, (dir + startingDirection) % 6);
      const neighborKey = hexKey(neighbor);

      if (reached.has(neighborKey) || !isWalkable(neighbor)) {
        continue;
      }

      const distance = currentInfo.distance + 1;
      const firstStep = currentInfo.firstStep || neighbor;
      reached.set(neighborKey, { distance, firstStep });
      queue.push(neighbor);

      if (distance > maxDistance) {
        maxDistance = distance;
        farthestStep = firstStep;
      }
    }
  }

  return farthestStep;
}
