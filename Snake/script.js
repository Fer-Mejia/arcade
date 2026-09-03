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

const box = 20; 
const cols = canvas.width / box;  // 20 columnas
const rows = canvas.height / box; // 17 filas

let snake, direction, nextDirection, food, score, highScore, gameInterval, gameRunning, isMuted;
let particles = [];

// Sintetizador Audio API
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
    osc.frequency.setValueAtTime(320, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(650, audioCtx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.12);
  } else if (type === 'die') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(40, audioCtx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.35);
  }
}

// Toggle Sonido
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

// Cargar Puntaje Máximo
highScore = localStorage.getItem('snake_high_score') || 0;
highScoreEl.textContent = highScore;

function setupGame() {
  snake = [
    { x: 8 * box, y: 8 * box },
    { x: 7 * box, y: 8 * box },
    { x: 6 * box, y: 8 * box }
  ];
  direction = null;
  nextDirection = null;
  score = 0;
  particles = [];
  scoreEl.textContent = score;
  
  food = spawnFood();
  gameRunning = false;
  
  draw();
}

function startGame() {
  startOverlay.classList.add('hidden');
  gameOverOverlay.classList.add('hidden');
  direction = 'RIGHT';
  nextDirection = 'RIGHT';
  gameRunning = true;

  if (gameInterval) clearInterval(gameInterval);
  gameInterval = setInterval(gameLoop, 110);
}

function spawnFood() {
  let newFood;
  do {
    newFood = {
      x: Math.floor(Math.random() * cols) * box,
      y: Math.floor(Math.random() * rows) * box
    };
  } while (snake.some(seg => seg.x === newFood.x && seg.y === newFood.y));
  return newFood;
}

function createParticles(x, y) {
  for (let i = 0; i < 10; i++) {
    particles.push({
      x: x + box / 2,
      y: y + box / 2,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.5) * 5,
      life: 1,
      size: Math.random() * 3 + 2,
      color: Math.random() > 0.3 ? '#ff3344' : '#ffd700'
    });
  }
}

// Escuchador global de teclado
window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();

  if (key === 'r') {
    e.preventDefault();
    setupGame();
    startGame();
    return;
  }

  const isArrowKey = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key);

  if (isArrowKey) {
    e.preventDefault();

    if (!gameRunning) {
      startGame();
    }

    if ((key === 'arrowup' || key === 'w') && direction !== 'DOWN') nextDirection = 'UP';
    else if ((key === 'arrowdown' || key === 's') && direction !== 'UP') nextDirection = 'DOWN';
    else if ((key === 'arrowleft' || key === 'a') && direction !== 'RIGHT') nextDirection = 'LEFT';
    else if ((key === 'arrowright' || key === 'd') && direction !== 'LEFT') nextDirection = 'RIGHT';
  }
});

// Manejadores de eventos táctiles para móviles
function handleDirectionInput(newDir) {
  if (!gameRunning) {
    startGame();
  }

  if (newDir === 'UP' && direction !== 'DOWN') nextDirection = 'UP';
  if (newDir === 'DOWN' && direction !== 'UP') nextDirection = 'DOWN';
  if (newDir === 'LEFT' && direction !== 'RIGHT') nextDirection = 'LEFT';
  if (newDir === 'RIGHT' && direction !== 'LEFT') nextDirection = 'RIGHT';
}

const btnUp = document.getElementById('btnUp');
const btnDown = document.getElementById('btnDown');
const btnLeft = document.getElementById('btnLeft');
const btnRight = document.getElementById('btnRight');

['touchstart', 'mousedown'].forEach(eventType => {
  btnUp.addEventListener(eventType, (e) => { e.preventDefault(); handleDirectionInput('UP'); });
  btnDown.addEventListener(eventType, (e) => { e.preventDefault(); handleDirectionInput('DOWN'); });
  btnLeft.addEventListener(eventType, (e) => { e.preventDefault(); handleDirectionInput('LEFT'); });
  btnRight.addEventListener(eventType, (e) => { e.preventDefault(); handleDirectionInput('RIGHT'); });
});
startBtn.addEventListener('click', (e) => { e.target.blur(); startGame(); });
restartBtn.addEventListener('click', (e) => { e.target.blur(); setupGame(); startGame(); });

function gameLoop() {
  update();
  draw();
}

function update() {
  if (!gameRunning || !direction) return;

  direction = nextDirection;
  let head = { x: snake[0].x, y: snake[0].y };

  if (direction === 'UP') head.y -= box;
  if (direction === 'DOWN') head.y += box;
  if (direction === 'LEFT') head.x -= box;
  if (direction === 'RIGHT') head.x += box;

  if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
    return endGame();
  }

  if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
    return endGame();
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score++;
    scoreEl.textContent = score;
    playSound('eat');
    createParticles(food.x, food.y);
    food = spawnFood();
    
    if (score > highScore) {
      highScore = score;
      highScoreEl.textContent = highScore;
      localStorage.setItem('snake_high_score', highScore);
    }
  } else {
    snake.pop();
  }

  particles.forEach((p, idx) => {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.06;
    if (p.life <= 0) particles.splice(idx, 1);
  });
}

/* DIBUJADO COMPLETO ESTILO CÉSPED & SERPIENTE ESMERALDA */
function draw() {
  // 1. Dibujar el Césped (Cuadrícula alternada estilo jardín)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? '#26421a' : '#1e3614';
      ctx.fillRect(c * box, r * box, box, box);
    }
  }

  // Líneas suaves de la cuadrícula
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
  ctx.lineWidth = 1;
  for (let c = 0; c <= cols; c++) {
    ctx.beginPath();
    ctx.moveTo(c * box, 0); ctx.lineTo(c * box, canvas.height);
    ctx.stroke();
  }
  for (let r = 0; r <= rows; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * box); ctx.lineTo(canvas.width, r * box);
    ctx.stroke();
  }

  // 2. Dibujar Partículas de la comida atrapada
  particles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });

  // 3. Dibujar la Manzana Realista
  if (food) {
    const fx = food.x + box / 2;
    const fy = food.y + box / 2;

    // Resplandor cálido de la manzana
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(255, 60, 60, 0.6)';

    // Cuerpo de la Manzana (Gradiente Rojo)
    const appleGrad = ctx.createRadialGradient(fx - 2, fy - 2, 1, fx, fy, box / 2 - 2);
    appleGrad.addColorStop(0, '#ff6b6b');
    appleGrad.addColorStop(0.7, '#d31226');
    appleGrad.addColorStop(1, '#7a000e');

    ctx.fillStyle = appleGrad;
    ctx.beginPath();
    ctx.arc(fx, fy + 1, box / 2 - 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Brillo en la parte superior izquierda de la manzana
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(fx - 3, fy - 3, 2, 0, Math.PI * 2);
    ctx.fill();

    // Tallo de la manzana
    ctx.strokeStyle = '#5c3a21';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(fx, fy - box / 2 + 3);
    ctx.quadraticCurveTo(fx + 2, fy - box / 2, fx + 3, fy - box / 2 - 2);
    ctx.stroke();

    // Hoja verde de la manzana
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.ellipse(fx + 3, fy - box / 2, 3, 1.5, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Dibujar la Serpiente Esmeralda (Esferas suaves con ojitos)
  snake.forEach((seg, index) => {
    const isHead = index === 0;
    const cx = seg.x + box / 2;
    const cy = seg.y + box / 2;
    const radius = isHead ? box / 2 - 1 : box / 2 - 2;

    // Sombra proyectada sobre el pasto
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';

    // Gradiente esférico verde esmeralda
    const snakeGrad = ctx.createRadialGradient(
      cx - radius * 0.3, cy - radius * 0.3, radius * 0.1,
      cx, cy, radius
    );

    if (isHead) {
      snakeGrad.addColorStop(0, '#86efac');
      snakeGrad.addColorStop(0.5, '#22c55e');
      snakeGrad.addColorStop(1, '#14532d');
    } else {
      snakeGrad.addColorStop(0, '#4ade80');
      snakeGrad.addColorStop(0.6, '#16a34a');
      snakeGrad.addColorStop(1, '#064e3b');
    }

    ctx.fillStyle = snakeGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Ojos de la cabeza
    if (isHead) {
      let eye1X = cx, eye1Y = cy, eye2X = cx, eye2Y = cy;

      if (direction === 'RIGHT') { eye1X += 3; eye1Y -= 4; eye2X += 3; eye2Y += 4; }
      else if (direction === 'LEFT') { eye1X -= 3; eye1Y -= 4; eye2X -= 3; eye2Y += 4; }
      else if (direction === 'UP') { eye1X -= 4; eye1Y -= 3; eye2X += 4; eye2Y -= 3; }
      else { eye1X -= 4; eye1Y += 3; eye2X += 4; eye2Y += 3; }

      // Esclerótica (blanco del ojo)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(eye1X, eye1Y, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(eye2X, eye2Y, 2.5, 0, Math.PI * 2); ctx.fill();

      // Pupila negra
      ctx.fillStyle = '#000000';
      ctx.beginPath(); ctx.arc(eye1X, eye1Y, 1.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(eye2X, eye2Y, 1.2, 0, Math.PI * 2); ctx.fill();
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