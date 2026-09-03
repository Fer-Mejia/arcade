const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const finalScoreEl = document.getElementById('finalScore');
const startOverlay = document.getElementById('startOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const muteBtn = document.getElementById('muteBtn');
const muteIcon = document.getElementById('muteIcon');

const W = canvas.width;
const H = canvas.height;
const gridSize = 18; // 20x20 celdas
const tileCount = W / gridSize;

let snake, food, dx, dy, score, highScore, gameInterval, gameRunning, isMuted;

// Audio Synthesizer (Web Audio API)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
isMuted = false;

function playSound(type) {
  if (isMuted) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  if (type === 'eat') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(700, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  } else if (type === 'die') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(50, audioCtx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  }
}

muteBtn.addEventListener('click', (e) => {
  isMuted = !isMuted;
  if (isMuted) {
    muteIcon.className = 'fa-solid fa-volume-xmark';
    muteBtn.classList.add('muted');
  } else {
    muteIcon.className = 'fa-solid fa-volume-high';
    muteBtn.classList.remove('muted');
  }
  e.target.blur();
});

highScore = localStorage.getItem('snake_classic_high_score') || 0;
highScoreEl.textContent = highScore;

function setupGame() {
  snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 }
  ];
  dx = 1;
  dy = 0;
  score = 0;
  scoreEl.textContent = score;
  gameRunning = false;
  spawnFood();
  draw();
}

function spawnFood() {
  food = {
    x: Math.floor(Math.random() * tileCount),
    y: Math.floor(Math.random() * tileCount)
  };
  // Prevenir que la comida aparezca sobre el cuerpo
  for (let segment of snake) {
    if (segment.x === food.x && segment.y === food.y) {
      spawnFood();
      break;
    }
  }
}

function startGame() {
  startOverlay.classList.add('hidden');
  gameOverOverlay.classList.add('hidden');

  if (!gameRunning) {
    setupGame();
    gameRunning = true;

    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, 110);
  }
}

window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();

  if (key === 'enter' || key === 'r') {
    e.preventDefault();
    setupGame();
    startGame();
    return;
  }

  if (!gameRunning) return;

  if ((key === 'arrowup' || key === 'w') && dy === 0) {
    dx = 0; dy = -1;
  } else if ((key === 'arrowdown' || key === 's') && dy === 0) {
    dx = 0; dy = 1;
  } else if ((key === 'arrowleft' || key === 'a') && dx === 0) {
    dx = -1; dy = 0;
  } else if ((key === 'arrowright' || key === 'd') && dx === 0) {
    dx = 1; dy = 0;
  }
});

startBtn.addEventListener('click', (e) => {
  e.target.blur();
  startGame();
});

restartBtn.addEventListener('click', (e) => {
  e.target.blur();
  setupGame();
  startGame();
});

function gameLoop() {
  update();
  draw();
}

function update() {
  const head = { x: snake[0].x + dx, y: snake[0].y + dy };

  // Colisión contra paredes
  if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
    return endGame();
  }

  // Colisión consigo misma
  for (let i = 0; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) {
      return endGame();
    }
  }

  snake.unshift(head);

  // Comer manzana
  if (head.x === food.x && head.y === food.y) {
    score++;
    scoreEl.textContent = score;
    playSound('eat');

    if (score > highScore) {
      highScore = score;
      highScoreEl.textContent = highScore;
      localStorage.setItem('snake_classic_high_score', highScore);
    }
    spawnFood();
  } else {
    snake.pop();
  }
}

function draw() {
  // Fondo de cuadrícula
  for (let r = 0; r < tileCount; r++) {
    for (let c = 0; c < tileCount; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? '#1e272e' : '#222f3e';
      ctx.fillRect(c * gridSize, r * gridSize, gridSize, gridSize);
    }
  }

  // Comida (Manzana)
  ctx.fillStyle = '#ff4757';
  ctx.beginPath();
  ctx.arc(
    food.x * gridSize + gridSize / 2,
    food.y * gridSize + gridSize / 2,
    gridSize / 2 - 2,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Hoja de la manzana
  ctx.fillStyle = '#2ecc71';
  ctx.fillRect(food.x * gridSize + gridSize / 2, food.y * gridSize + 1, 3, 3);

  // Serpiente
  snake.forEach((segment, index) => {
    if (index === 0) {
      // Cabeza
      ctx.fillStyle = '#2ecc71';
      ctx.fillRect(
        segment.x * gridSize + 1,
        segment.y * gridSize + 1,
        gridSize - 2,
        gridSize - 2
      );

      // Ojos
      ctx.fillStyle = '#1e272e';
      ctx.fillRect(segment.x * gridSize + 4, segment.y * gridSize + 4, 3, 3);
      ctx.fillRect(segment.x * gridSize + 11, segment.y * gridSize + 4, 3, 3);
    } else {
      // Cuerpo
      ctx.fillStyle = index % 2 === 0 ? '#27ae60' : '#219150';
      ctx.fillRect(
        segment.x * gridSize + 1,
        segment.y * gridSize + 1,
        gridSize - 2,
        gridSize - 2
      );
    }
  });
}

function endGame() {
  playSound('die');
  clearInterval(gameInterval);
  gameRunning = false;
  finalScoreEl.textContent = score;
  gameOverOverlay.classList.remove('hidden');
}

setupGame();