// Pathfinding on the hex grid. The functions only know about hexes, through two callbacks:
// isWalkable(hex) says whether a hex can be entered, isGoal(hex) whether the search can stop there.
//
// Every step costs 1 on this board, so a breadth-first search finds the same shortest paths
// as Dijkstra's algorithm would.

// Breadth-first search for the nearest goal.
// Returns the path to it (start excluded, goal included), or null if no goal can be reached.
function findShortestPath(start, isGoal, isWalkable) {
  const previous = new Map([[hexKey(start), null]]);
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

      if (isGoal(neighbor)) {
        // Found the nearest goal, construct the path by following previous steps
        const path = [];
        for (let step = neighbor; step !== start; step = previous.get(hexKey(step))) {
          path.unshift(step);
        }
        return path;
      }

      queue.push(neighbor);
    }
  }

  return null;
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
