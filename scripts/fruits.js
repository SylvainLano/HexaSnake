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
for (const fruit of possibleFruits) {
  fruit.image = new Image();
  fruit.image.src = fruit.imagePath;
}

// Helper to get a random fruit assigned
function getRandomFruit() {
  const randomIndex = Math.floor(Math.random() * possibleFruits.length);
  return possibleFruits[randomIndex];
}
