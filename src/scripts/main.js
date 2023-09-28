class Snake {
  constructor(headX, headY, length, color) {
    this.position = { q: headX, r: headY };
    this.length = length;
    this.color = color;
    this.body = []; // Initialize an empty body
    this.isAlive = true;
    this.stepToConsume = 0;
    this.numberOfStepToConsume = 24;
    this.minLength = 2;

    // Create the body
    for (let i = 0; i < length; i++) {
      this.body.push({ q: headX - i, r: headY });
    }
  }

  isSnake(hexX, hexY) {
    // Check if the given hexagonal coordinates are part of the snake's body
    for (const segment of this.body) {
      if (segment.q === hexX && segment.r === hexY) {
        return true; // The hexagon is part of the snake
      }
    }
    return false; // The hexagon is not part of the snake
  }

  // method to move the snake towards a fruit given the fruit list
  move(fruits, gridSize) {
    
    const moveTo = this.findNearestFruit(this.position, fruits, gridSize);

    // check wether the next step is different from the head of the snake
    if ( !this.isSameHex(this.position, moveTo) ){
      // returns true if a fruit is eaten
      return this.moveTo( moveTo, fruits );
    } else {
      // No fruits available to eat, move the snake randomly
      this.moveRandomly(gridSize);
    }

    return false;

  }

  // method to find the closest fruit given the position start and the fruit list
  findNearestFruit(start, fruits, gridSize) {
    const visited = new Set();
    const previous = new Map();
    const queue = [];

    queue.push(start);
    visited.add(this.hexToString(start));

    while (queue.length > 0) {
      const current = queue.shift();

      for (let dir = 0; dir < 6; dir++) {
        const neighbor = this.hex_neighbor(current.q, current.r, dir);
        const neighborString = this.hexToString(neighbor);

        if (
          neighbor.q >= 0 &&
          neighbor.q < gridSize &&
          neighbor.r >= 0 &&
          neighbor.r < gridSize &&
          !visited.has(neighborString) &&
          !this.isSnake(neighbor.q, neighbor.r)
        ) {
          visited.add(neighborString);
          previous.set(neighborString, current); // Store the actual neighbor, not as string

          if (fruits.some((fruit) => this.isSameHex(neighbor, fruit))) {
            // Found the nearest fruit, construct the path by following previous steps
            const path = [];
            let step = neighborString;
            while (previous.has(step)) {
              path.unshift(this.stringToHex(step)); // Convert back to hex
              step = this.hexToString(previous.get(step)); // Move to the previous step
            }
            return path[0]; // Return the first step of the path
          }

          queue.push(neighbor);
        }
      }
    }
    return start; // No reachable fruit found, return the starting position
  }

  // method to find the safest step to take when there is no fruit
  findSafestStep(start, gridSize, startingDirection) {
    const visited = new Set();
    const previous = new Map();
    const queue = [];
  
    queue.push(start);
    visited.add(this.hexToString(start));
    let safestStep = null; // Store the safest step (the first step of the path)
    let maxSteps = 0; // Store the maximum number of steps
  
    while (queue.length > 0) {
      const current = queue.shift();
  
      for (let dir = 0; dir < 6; dir++) {
        const neighbor = this.hex_neighbor(current.q, current.r, ((dir+startingDirection)%6));
        const neighborString = this.hexToString(neighbor);
  
        if (
          neighbor.q >= 0 &&
          neighbor.q < gridSize &&
          neighbor.r >= 0 &&
          neighbor.r < gridSize &&
          !visited.has(neighborString) &&
          !this.isSnake(neighbor.q, neighbor.r)
        ) {
          visited.add(neighborString);
          previous.set(neighborString, this.hexToString(current));
          queue.push(neighbor);
          const path = [];
          let step = neighborString;
          while (previous.has(step)) {
            path.unshift(step);
            step = previous.get(step); // Move to the previous step
          }
  
          // If this path has more steps than the current safest path, update safestStep
          if (path.length > maxSteps) {
            maxSteps = path.length;
            safestStep = this.stringToHex(path[0]); // Store the first step of the path
          }
        }
      }
    }
  
    return safestStep; // Return the first step of the safest path
  }
  
  hexToString(hex) {
    return `${hex.q},${hex.r}`;
  }
  
  stringToHex(str) {
    const [q, r] = str.split(',').map(Number);
    return { q, r };
  }

  // Function to calculate the coordinate of the next hex in a given direction
  hex_neighbor(q, r, direction) {
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

  // Function to check if two hexagons are the same
  isSameHex(hex1, hex2) {
    return hex1.q === hex2.q && hex1.r === hex2.r;
  }

  // method to move the snake one step towards a fruit
  moveTo ( moveTo, fruits ) {
    this.position = moveTo;
    this.addHunger();
    // Update the snake's body (add a new head segment)
    this.body.unshift({ q: moveTo.q, r: moveTo.r });
    // Check if the snake's head is in the same hex as a fruit
    for (let i = 0; i < fruits.length; i++) {
      const fruit = fruits[i];
      if (this.isSameHex(this.position, fruit)) {
        this.length++;
        return true;
      }
    }
    this.body.pop();
    return false;
  }

  // method to simulate the consumption of energy (snake gets shorter)
  addHunger () {
    this.stepToConsume++;
    if ( this.stepToConsume >= this.numberOfStepToConsume && this.length > this.minLength ) {
      this.length--;
      this.body.pop();
      this.stepToConsume = 0;
    }
  }

  // method to move the snake randomly
  moveRandomly(gridSize) {

    const availableDirections = this.listValidDirections ( gridSize );

    // If there are available directions, choose one randomly
    if (availableDirections.length > 0) {
      var preferedDirection = Math.floor(Math.random() * availableDirections.length);
      this.moveTo( this.findSafestStep(this.position, gridSize, preferedDirection), [] );
      this.addHunger();
    } else {
      this.isAlive = false;
    }
    
  }

  // method to return the new position given the direction of the snake
  forwardPosition(newDirection) {
    const { q, r } = this.position; // Get the current axial position of the snake
    let targetQ, targetR;
  
    const isEvenRow = r % 2 === 0;
    switch (newDirection) {
      case 0: // Move up-right
        targetQ = isEvenRow ? q : q + 1;
        targetR = r - 1;
        break;
      case 1: // Move right
        targetQ = q + 1;
        targetR = r;
        break;
      case 2: // Move down-right
        targetQ = isEvenRow ? q : q + 1;
        targetR = r + 1;
        break;
      case 3: // Move down-left
        targetQ = isEvenRow ? q - 1 : q;
        targetR = r + 1;
        break;
      case 4: // Move left
        targetQ = q - 1;
        targetR = r;
        break;
      case 5: // Move up-left
        targetQ = isEvenRow ? q - 1 : q;
        targetR = r - 1;
        break;
    }
    return { q: targetQ, r: targetR }
  }

  // method to update the snake's body (add a new head segment and remove the last segment)
  updatePosition(direction) {
    var moveTo = this.forwardPosition( direction );
    this.position = moveTo;
    this.body.unshift(moveTo);
    this.body.pop();
  }

  // method to list available directions to move to
  listValidDirections ( gridSize ) {
    // Create an array to store available directions
    const availableDirections = [];

    // Check each direction for obstacles and add clear directions to the array
    for (let direction = 0; direction < 6; direction++) {
      if (this.isDirectionClear(direction, gridSize)) {
        availableDirections.push(direction);
      }
    }

    return availableDirections;
  }

  // method to check for obstacles in a direction (borders and snake parts)
  isDirectionClear( direction, gridSize ) {
    var moveTo = this.forwardPosition( direction );

    if (moveTo.q < 0 || moveTo.r < 0 || moveTo.q >= gridSize || moveTo.r >= gridSize) {
      return false; // Out of bounds
    }

    // Check if there is a snake part at the target coordinates
    // Implement your logic to check for snake parts
    const isBlocked = this.isSnake(moveTo.q, moveTo.r);
  
    return !isBlocked; // Return true if the direction is clear, false if blocked
  }

}

class Fruit {
  constructor(x, y) {
      this.q = x;
      this.r = y;
      this.fruit = getRandomFruit();
  }
}

var canvas = document.getElementById('board');
var ctx = canvas.getContext('2d');
var hasAddListener = false;
var clickListener = null;
var mouseMoveListener = null;
var fillColor = '#000000';
var outlineColor = '#EEEEEE';
var hoverOutlineColor = "#FF0000";
var isChangingBorder = false;
var sideOfBoard = 590;
var padding = 5;

// setting up all the fruits
const possibleFruits = [
  { name: 'Apple', imagePath: 'images/fruit-apple.png' },
  { name: 'Banana', imagePath: 'images/fruit-banana.png' },
  { name: 'Cherry', imagePath: 'images/fruit-cherry.png' },
  { name: 'Blueberry', imagePath: 'images/fruit-blueberry.png' },
  { name: 'Coconut', imagePath: 'images/fruit-coconut.png' },
  { name: 'Grape', imagePath: 'images/fruit-grape.png' },
  { name: 'Kiwi', imagePath: 'images/fruit-kiwi.png' },
  { name: 'Lemon', imagePath: 'images/fruit-lemon.png' },
  { name: 'Lime', imagePath: 'images/fruit-lime.png' },
  { name: 'Orange', imagePath: 'images/fruit-orange.png' },
  { name: 'Peach', imagePath: 'images/fruit-peach.png' },
  { name: 'Pear', imagePath: 'images/fruit-pear.png' },
  { name: 'Pomegranate', imagePath: 'images/fruit-pomegranate.png' },
  { name: 'Strawberry', imagePath: 'images/fruit-strawberry.png' },
  { name: 'Watermelon', imagePath: 'images/fruit-watermelon.png' }
];

// Load all fruit images
const fruitImages = [];
for (const fruit of possibleFruits) {
  const img = new Image();
  img.src = fruit.imagePath;
  fruitImages.push({ name: fruit.name, image: img });
}

// Helper function to get an image object by fruit name
function getImageByFruitName(name) {
  const fruit = fruitImages.find((f) => f.name === name);
  return fruit ? fruit.image : null;
}

// Helper to get a random fruit assigned
function getRandomFruit() {
  const randomIndex = Math.floor(Math.random() * possibleFruits.length);
  return possibleFruits[randomIndex];
}

// Score management
var score = 0;
// Get the element with the id "score_display"
const scoreDisplay = document.getElementById("score_display");

// Setting up snake data
var startingHeadX = 12;
var startingHeadY = 12;
var initialLength = 5;
var snakeColor = '#44F044';
var snakeDeadColor = '#F04444';
// Create a new Snake instance
var snake = new Snake(startingHeadX, startingHeadY, initialLength, snakeColor);

// Setting up fruits data
var fruitColor = '#F0F044';
var fruits = [];

// Creating the empty grid
var grid = [];
var stepSpeed = 200;

// Method for each frame
function step() {
  if ( snake.listValidDirections().length == 0 || snake.isAlive == false ) {
    snake.isAlive = false;
    makeBoard(grid.length);
    return;
  }
  if ( fruits.length != 0 ) {
    if ( snake.move(fruits, grid.length) ) {
      grid[snake.position.r][snake.position.q].isAlive = false;
      for (let i = 0; i < fruits.length; i++) {
        const fruit = fruits[i];
        if (snake.isSameHex(snake.position, fruit)) {
          fruits.splice(i, 1);
          score += 20;
        }
      }
    }
  } else {
    snake.moveRandomly( grid.length );
  }
  let scoreAddition = snake.length - initialLength;
  if ( scoreAddition >= 1 ) {
    scoreAddition = Math.ceil( Math.log( scoreAddition ) );
  }
  score = Math.max(0, score + scoreAddition );
  scoreDisplay.innerHTML = score;
  makeBoard(grid.length);
}

// Method to create the board
var makeBoard = function(width) {

    var hexHeight,
        hexRadius,
        hexRectangleHeight,
        hexRectangleWidth,
        hexagonAngle = 0.523598776, // 30 degrees in radians
        sideLength = sideOfBoard / (width + .5) / Math.sqrt(3),
        boardWidth = width,
        boardHeight = width;

		hexHeight = Math.sin(hexagonAngle) * sideLength;
		hexRadius = Math.cos(hexagonAngle) * sideLength;
		hexRectangleHeight = sideLength + 2 * hexHeight;
		hexRectangleWidth = 2 * hexRadius;

    if (canvas.getContext) {

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = fillColor;
      ctx.strokeStyle = outlineColor;
      if(width != 100)
      {
        ctx.lineWidth = 1;
      }
      else
      {
        ctx.lineWidth = 0.25;
      }
      drawBoard(ctx, boardWidth, boardHeight);

      clickListener = function(eventInfo) {
          var x,
              y,
              hexX,
              hexY,
              screenX,
              screenY;

          x = eventInfo.offsetX || eventInfo.layerX;
          y = eventInfo.offsetY || eventInfo.layerY;
          x -= padding;
          y -= padding;

          hexY = Math.floor(y / (hexHeight + sideLength));
          hexX = Math.floor((x - (hexY % 2) * hexRadius) / hexRectangleWidth);

          screenX = hexX * hexRectangleWidth + ((hexY % 2) * hexRadius);
          screenY = hexY * (hexHeight + sideLength);

          // Clear the board
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Check if the mouse's coords are on the board
          if (hexX >= 0 && hexX < boardWidth) {
              if (hexY >= 0 && hexY < boardHeight) {
                  if ( !grid[hexY][hexX].isAlive ) {
                    const newFruit = new Fruit(hexX, hexY); // Replace x and y with the coordinates
                    fruits.push(newFruit);
                  } else {
                    for (let i = 0; i < fruits.length; i++) {
                      const fruit = fruits[i];
                      if ( fruit.q === hexX && fruit.r === hexY ) {
                        fruits.splice(i, 1);
                      }
                    }
                  }
                  grid[hexY][hexX].doSwap();
                  ctx.fillStyle = fillColor;
                  ctx.strokeStyle = outlineColor;
                  drawBoard(ctx, boardWidth, boardHeight);
              }
          }
      }

      mouseMoveListener = function(eventInfo) {
          var x,
          y,
          hexX,
          hexY,
          screenX,
          screenY;

          x = eventInfo.offsetX || eventInfo.layerX;
          y = eventInfo.offsetY || eventInfo.layerY;
          x -= padding;
          y -= padding;

          hexY = Math.floor(y / (hexHeight + sideLength));
          hexX = Math.floor((x - (hexY % 2) * hexRadius) / hexRectangleWidth);

          screenX = hexX * hexRectangleWidth + ((hexY % 2) * hexRadius) + padding;
          screenY = hexY * (hexHeight + sideLength) + padding;

          // Clear the board
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          drawBoard(ctx, boardWidth, boardHeight);

          // Check if the mouse's coords are on the board
          if (hexX >= 0 && hexX < boardWidth) {
              if (hexY >= 0 && hexY < boardHeight) {
                  isChangingBorder = true;
                  ctx.strokeStyle = hoverOutlineColor;
                  let fill = grid[hexY][hexX].isAlive ? "fruit" : "";                
                  drawHexagon(ctx, screenX, screenY, fill, hexX, hexY);
                  ctx.strokeStyle = outlineColor;
                  isChangingBorder = false;
              }
          }
      }

      //Event listeners
      if (!hasAddListener) {
        hasAddListener = true;

        canvas.addEventListener("click", function(eventInfo) {
          clickListener(eventInfo);
        });

        canvas.addEventListener("mousemove", function(eventInfo) {
          mouseMoveListener(eventInfo);
        });
      }
    }

    function drawBoard(canvasContext, width, height) {
      for (let i = 0; i < width; ++i) {
        for (let j = 0; j < height; ++j) {

          let fill = grid[j][i].isAlive ? "fruit" : ""; // Default to empty
    
          if (snake.isSnake(i, j)) {
            fill = "snake";
          }
    
          drawHexagon(
            canvasContext,
            i * hexRectangleWidth + ((j % 2) * hexRadius) + padding,
            j * (sideLength + hexHeight) + padding,
            fill, i, j
          );

        }
      }
    }

    function drawHexagon(canvasContext, x, y, fill, q, r) {

        canvasContext.beginPath();
        canvasContext.moveTo(x + hexRadius, y);
        canvasContext.lineTo(x + hexRectangleWidth, y + hexHeight);
        canvasContext.lineTo(x + hexRectangleWidth, y + hexHeight + sideLength);
        canvasContext.lineTo(x + hexRadius, y + hexRectangleHeight);
        canvasContext.lineTo(x, y + sideLength + hexHeight);
        canvasContext.lineTo(x, y + hexHeight);
        canvasContext.closePath();

        if (fill) {

          let fillStyle = fillColor;
        
          if (fill === "snake") {
            if ( snake.isAlive ) {
              canvasContext.fillStyle = snakeColor;
            } else {
              canvasContext.fillStyle = snakeDeadColor;
            }
            canvasContext.fill();
          } else if (fill === "fruit") { 
            let fruitImage = "images/fruit-cherry.png";
            for (let i = 0; i < fruits.length; i++) {
              const fruit = fruits[i];
              if (fruit.q == q && fruit.r == r) {
                fruitImage = getImageByFruitName(fruit.fruit.name);
              }
            }
            canvasContext.drawImage(fruitImage, x+2, y+2, hexRectangleWidth-4, hexRectangleHeight-4);
            canvasContext.fillStyle = fruitColor;
          } else {
            canvasContext.fillStyle = fillStyle;
            canvasContext.fill();
          }
          
        } else {
          canvasContext.stroke();
        }
    }

};

gameLoop = false;

function restart(size) {
    intervalEnd();
    setSize(size);
    makeBoard(size);
    snake = new Snake(startingHeadX, startingHeadY, initialLength, snakeColor);
    score = 0;
    intervalStart();
}

function board(size) {
    intervalEnd();
    setSize(size);
    makeBoard(size);
    intervalStart();
}

function updateBoard(){
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	makeBoard(grid.length);
}

function intervalStart() {
  if(gameLoop != false) {
    clearInterval(gameLoop);
  }
  gameLoop = setInterval(step, stepSpeed);
}

function intervalEnd() {
  if(gameLoop != false) {
    clearInterval(gameLoop);
  }
  gameLoop = false;
}

function pauseGame() {
  if(gameLoop == false) {
    intervalStart();
  } else {
    intervalEnd();
  }
}

// This creates the Node object.
function Node(row, col)
{
  this.row = row;
  this.col = col;
  this.isAlive = false;

  // doSwap()
  // swap alive to dead and dead to alive if marked to change.
  this.doSwap = function() {
    this.isAlive = !this.isAlive;
  }
}

//This will populate the array with tiles, based on which option the user choose for the size (1 = small, 2 = medium, 3 = large)
function setSize(size)
{
  //This clears the array so this method can be run several times.
  grid = [];
  fruits = [];

  var side = sideOfBoard / (size + .5) / Math.sqrt(3);
  document.getElementById('board').height = ((side * size) + (side * size / 2)) + (side/2) + 10;

  for(var row = 0; row < size; row++)
  {
    //The individual rows will be added one at a time
    var rowArr = [];
    for(var col = 0; col < size; col++)
    {
      //Adds a new node to the row
      var hex = new Node(row, col);
      rowArr.push(hex);
    }
    grid.push(rowArr);
  }
}

//This method will go through every node and give it a 5% chance of getting a fruit.
function randomize()
{ 
  for(var i = 0; i < grid.length; i++)
  {
    for(var j = 0; j < grid[i].length; j++)
    {
      var num = Math.random();
      if(num < 0.05)
      {
        grid[i][j].isAlive = true;
        const newFruit = new Fruit(j, i);
        fruits.push(newFruit);
      }
    }
  }
  updateBoard();
}

const input = document.querySelector("input");
var logArr = [1000, 750, 500, 375, 250, 200, 150, 100, 75, 50, 25];
input.addEventListener("input", function(event) {
  stepSpeed = logArr[event.target.value];
  intervalStart();
});

board(30);
