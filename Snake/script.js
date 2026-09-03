const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const finalScoreEl = document.getElementById('finalScore');

const startOverlay = document.getElementById('startOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');

const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

// Botones D-Pad Móvil
const btnUp = document.getElementById('btnUp');
const btnDown = document.getElementById('btnDown');
const btnLeft = document.getElementById('btnLeft');
const btnRight = document.getElementById('btnRight');

const gridSize = 18;
const tileCount = canvas.width / gridSize;

let snake = [];
let food = { x: 0, y: 0 };
let dx = gridSize;
let dy = 0;
let score = 0;
let highScore = localStorage.getItem('snake_highscore') || 0;
let gameInterval = null;
let isGameRunning = false;

highScoreEl.textContent = highScore;

function initGame() {
  snake = [
    { x: 5 * gridSize, y: 10 * gridSize },
    { x: 4 * gridSize, y: 10 * gridSize },
    { x: 3 * gridSize, y: 10 * gridSize }
  ];
  dx = gridSize;
  dy = 0;
  score = 0;
  scoreEl.textContent = score;
  spawnFood();
}

function spawnFood() {
  food.x = Math.floor(Math.random() * tileCount) * gridSize;
  food.y = Math.floor(Math.random() * tileCount) * gridSize;

  // Evitar que la comida aparezca encima de la serpiente
  snake.forEach(part => {
    if (part.x === food.x && part.y === food.y) {
      spawnFood();
    }
  });
}

function startGame() {
  initGame();
  isGameRunning = true;
  startOverlay.classList.add('hidden');
  gameOverOverlay.classList.add('hidden');
  
  if (gameInterval) clearInterval(gameInterval);
  gameInterval = setInterval(gameLoop, 110);
}

function gameOver() {
  isGameRunning = false;
  clearInterval(gameInterval);
  finalScoreEl.textContent = score;
  
  if (score > highScore) {
    highScore = score;
    highScoreEl.textContent = highScore;
    localStorage.setItem('snake_highscore', highScore);
  }
  
  gameOverOverlay.classList.remove('hidden');
}

function gameLoop() {
  update();
  draw();
}

function update() {
  const head = { x: snake[0].x + dx, y: snake[0].y + dy };

  // Colisión con paredes
  if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
    gameOver();
    return;
  }

  // Colisión consigo misma
  for (let i = 0; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) {
      gameOver();
      return;
    }
  }

  snake.unshift(head);

  // Comer manzana
  if (head.x === food.x && head.y === food.y) {
    score += 10;
    scoreEl.textContent = score;
    spawnFood();
  } else {
    snake.pop();
  }
}

function draw() {
  // Limpiar Canvas
  ctx.fillStyle = '#20bf6b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Dibujar comida (manzana retro)
  ctx.fillStyle = '#eb4d4b';
  ctx.fillRect(food.x, food.y, gridSize - 2, gridSize - 2);

  // Dibujar serpiente
  snake.forEach((part, index) => {
    ctx.fillStyle = index === 0 ? '#f1c40f' : '#ffffff';
    ctx.fillRect(part.x, part.y, gridSize - 2, gridSize - 2);
  });
}

// Funciones de control de dirección
function moveUp() {
  if (dy === 0) { dx = 0; dy = -gridSize; }
}
function moveDown() {
  if (dy === 0) { dx = 0; dy = gridSize; }
}
function moveLeft() {
  if (dx === 0) { dx = -gridSize; dy = 0; }
}
function moveRight() {
  if (dx === 0) { dx = gridSize; dy = 0; }
}

// Escuchadores del Teclado
document.addEventListener('keydown', (e) => {
  if (!isGameRunning && (e.key === 'Enter' || e.key === 'r' || e.key === 'R')) {
    startGame();
    return;
  }

  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') moveUp();
  if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') moveDown();
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') moveLeft();
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') moveRight();
});

// Escuchadores Táctiles / Click D-Pad
btnUp.addEventListener('touchstart', (e) => { e.preventDefault(); moveUp(); });
btnDown.addEventListener('touchstart', (e) => { e.preventDefault(); moveDown(); });
btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); moveLeft(); });
btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); moveRight(); });

btnUp.addEventListener('click', moveUp);
btnDown.addEventListener('click', moveDown);
btnLeft.addEventListener('click', moveLeft);
btnRight.addEventListener('click', moveRight);

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);