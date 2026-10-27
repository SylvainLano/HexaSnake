# HexaSnake

A snake that plays by itself on a hexagonal grid, and a small study of how it finds its way to the fruits.

**[Play it online](https://sylvainlano.github.io/HexaSnake/index.html)** — plain JavaScript, no dependencies, no build step.

## The question

In 2023, I was chatting with my brother about pathfinding. Dijkstra, A* and their cousins are nearly always explained on square grids. So what happens on hexagons? This snake was my answer, first written in about twelve hours, then reworked into a small study.

Hexagons turn out to be friendly to these algorithms: the six neighbours of a cell are all at the same distance, so there are no diagonals to handle, and the distance between two cells can be computed exactly.

## How to play

The snake looks for the nearest fruit on its own: you can only feed it. Don't overfeed it, or it might bite its own tail...

- **Left click** drops or removes fruits, **right click** builds or removes walls. Hold and drag to draw.
- **Gorge** drops fruits everywhere, **Starve** removes them all, **Demolish** removes the walls.
- **Size** sets the board from 10 to 60 cells wide, while the score is 0 (Restart to resize).
- **Algorithm** picks how the snake finds its way, **Smart** makes it avoid dead ends.
- **View: Explored** shows the cells the last search looked at, and the path it found.
- The **?** next to the title opens the study, page by page.

## The study

At every step, four algorithms search for the nearest fruit in the same situation. The table and the chart compare their time, the cells they explore and the length of their paths.

| Algorithm | Idea | Result |
|---|---|---|
| Dijkstra | Explores ring after ring (a breadth-first search, since every step costs 1) | The reference |
| A* | Explores first the cells that look closest to a fruit | Same paths, about 10 times fewer cells explored on random boards |
| AW | "Aware" A*: remembers its path, and only searches again when something around it changes | Same paths, 1.5 to 2.8 times fewer cells and 1.6 to 7 times less time than A* |
| AW# | AW written with numbered cells and plain lists of numbers | Exactly the same choices as AW, 2.7 to 9.6 times less time |

On top of any of them, **Smart** checks before taking a way that its head could still reach its tail at the end of it. The snake then lives 2.4 to 4.3 times longer.

The details, and the lessons learned along the way, are in the game (the **?** button). Times were measured in Chrome, and depend on the machine.

## Run it locally

Open `index.html` in a browser. There is nothing to install or build.

## Code

| File | What it does |
|---|---|
| `index.html` | The page, and the text of the study |
| `css/style.css` | The look of the page |
| `scripts/hex.js` | Hex grid geometry: offset coordinates ("odd-r"), neighbours, distance, pixels and hexes |
| `scripts/board.js` | The board: its fruits and walls |
| `scripts/fruits.js` | The fruits and their images |
| `scripts/pathfinding.js` | Dijkstra, A* and AW |
| `scripts/numbered.js` | AW#, with numbered cells |
| `scripts/snake.js` | The snake: its moves, its hunger and its Smart mode |
| `scripts/render.js` | Drawing the board |
| `scripts/chart.js` | The comparison chart |
| `scripts/study.js` | The study panel |
| `scripts/main.js` | The game loop, the controls and the comparison |

## Credits

- [Madfont](https://www.dafont.com/madfont-regular.font) by Harold's Fonts, listed as 100% free on dafont.com, for the titles and buttons.
- Jersey 10 by The Soft Type Project Authors, under the SIL Open Font License (`fonts/Jersey10-OFL.txt`), for the numbers and texts.
