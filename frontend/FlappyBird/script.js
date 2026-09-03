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

// Física
const gravity = 0.38;
const jumpForce = -6.5;

// Tubos
const pipeWidth = 58;
const pipeGap = 130;
const pipeSpeed = 2.1;

let bird, pipes, particles, score, highScore, frame, gameInterval, gameRunning, isMuted;
let cloudOffset = 0;
let mountainOffset = 0;
let bushOffset = 0;

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

  if (type === 'flap') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(850, audioCtx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.08);
  } else if (type === 'score') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
    osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.22);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.22);
  } else if (type === 'hit') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(40, audioCtx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.25);
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

// Cargar Récord Máximo
highScore = localStorage.getItem('flappy_classic_high_score') || 0;
highScoreEl.textContent = highScore;

function setupGame() {
  bird = { x: 75, y: H / 2 - 20, velocity: 0, radius: 14, wingAngle: 0 };
  pipes = [];
  particles = [];
  score = 0;
  frame = 0;
  scoreEl.textContent = score;
  gameRunning = false;

  draw();
}

function startGame() {
  startOverlay.classList.add('hidden');
  gameOverOverlay.classList.add('hidden');
  
  if (!gameRunning) {
    setupGame();
    gameRunning = true;
    flap();

    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, 1000 / 60);
  }
}

function flap() {
  if (!gameRunning) return;
  bird.velocity = jumpForce;
  playSound('flap');
  createFeathers(bird.x, bird.y);
}

function createFeathers(x, y) {
  for (let i = 0; i < 6; i++) {
    particles.push({
      x: x - 10,
      y: y,
      vx: (Math.random() - 0.7) * 2.5,
      vy: (Math.random() - 0.5) * 2,
      life: 1,
      size: Math.random() * 3.5 + 2,
      color: Math.random() > 0.5 ? '#fff' : '#f1c40f'
    });
  }
}

function spawnPipe() {
  const minTop = 50;
  const maxTop = H - pipeGap - 90;
  const topHeight = Math.floor(Math.random() * (maxTop - minTop)) + minTop;

  pipes.push({
    x: W,
    top: topHeight,
    bottom: topHeight + pipeGap,
    passed: false
  });
}

// Teclado
window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();

  if (key === 'enter') {
    e.preventDefault();
    setupGame();
    startGame();
    return;
  }

  if (e.code === 'Space' || key === 'arrowup' || key === 'w') {
    e.preventDefault();
    if (!gameRunning) {
      startGame();
    } else {
      flap();
    }
  }
});

// Click / Tap en Canvas
canvas.addEventListener('mousedown', (e) => {
  e.preventDefault();
  if (!gameRunning) {
    startGame();
  } else {
    flap();
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
  if (!gameRunning) return;

  frame++;

  bird.velocity += gravity;
  bird.y += bird.velocity;
  bird.wingAngle = Math.sin(frame * 0.35) * 10;

  cloudOffset = (cloudOffset + 0.4) % W;
  mountainOffset = (mountainOffset + 0.8) % W;
  bushOffset = (bushOffset + pipeSpeed) % W;

  if (frame % 95 === 0) {
    spawnPipe();
  }

  pipes.forEach(pipe => {
    pipe.x -= pipeSpeed;

    if (!pipe.passed && pipe.x + pipeWidth < bird.x) {
      pipe.passed = true;
      score++;
      scoreEl.textContent = score;
      playSound('score');

      if (score > highScore) {
        highScore = score;
        highScoreEl.textContent = highScore;
        localStorage.setItem('flappy_classic_high_score', highScore);
      }
    }
  });

  pipes = pipes.filter(pipe => pipe.x + pipeWidth > 0);

  particles.forEach((p, idx) => {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.04;
    if (p.life <= 0) particles.splice(idx, 1);
  });

  if (bird.y + bird.radius >= H - 35 || bird.y - bird.radius <= 0) {
    return endGame();
  }

  for (const pipe of pipes) {
    const bR = bird.x + bird.radius - 3;
    const bL = bird.x - bird.radius + 3;
    const bT = bird.y - bird.radius + 3;
    const bB = bird.y + bird.radius - 3;

    if (bR > pipe.x && bL < pipe.x + pipeWidth) {
      if (bT < pipe.top || bB > pipe.bottom) {
        return endGame();
      }
    }
  }
}

function draw() {
  // Sky Gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H - 35);
  skyGrad.addColorStop(0, '#4facfe');
  skyGrad.addColorStop(0.6, '#00f2fe');
  skyGrad.addColorStop(1, '#a8edf0');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H);

  // Sun
  ctx.fillStyle = 'rgba(255, 234, 167, 0.8)';
  ctx.beginPath();
  ctx.arc(W - 60, 60, 35, 0, Math.PI * 2);
  ctx.fill();

  // Clouds
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  for (let i = -1; i < 2; i++) {
    const x = i * W - cloudOffset;
    drawCloud(x + 40, 70, 0.8);
    drawCloud(x + 220, 110, 1.1);
  }

  // Mountains
  ctx.fillStyle = '#81ecec';
  for (let i = -1; i < 3; i++) {
    const x = i * 180 - (mountainOffset * 0.5);
    ctx.beginPath();
    ctx.moveTo(x, H - 35);
    ctx.lineTo(x + 90, H - 120);
    ctx.lineTo(x + 180, H - 35);
    ctx.closePath();
    ctx.fill();
  }

  // Hills
  ctx.fillStyle = '#55efc4';
  for (let i = -1; i < 3; i++) {
    const x = i * 140 - (mountainOffset % 140);
    ctx.beginPath();
    ctx.arc(x + 40, H - 35, 45, Math.PI, 0);
    ctx.fill();
  }

  // Pipes
  pipes.forEach(pipe => {
    const pipeGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipeWidth, 0);
    pipeGrad.addColorStop(0, '#2ea043');
    pipeGrad.addColorStop(0.2, '#56d364');
    pipeGrad.addColorStop(0.7, '#238636');
    pipeGrad.addColorStop(1, '#1e682b');

    ctx.fillStyle = pipeGrad;
    ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top);
    ctx.fillRect(pipe.x, pipe.bottom, pipeWidth, H - pipe.bottom - 35);

    const capHeight = 22;
    const capOverlap = 4;
    
    ctx.fillStyle = '#2ea043';
    ctx.fillRect(pipe.x - capOverlap, pipe.top - capHeight, pipeWidth + (capOverlap * 2), capHeight);
    ctx.fillRect(pipe.x - capOverlap, pipe.bottom, pipeWidth + (capOverlap * 2), capHeight);

    ctx.fillStyle = '#7ee787';
    ctx.fillRect(pipe.x - capOverlap + 4, pipe.top - capHeight + 3, 6, capHeight - 6);
    ctx.fillRect(pipe.x - capOverlap + 4, pipe.bottom + 3, 6, capHeight - 6);

    ctx.strokeStyle = '#14461b';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(pipe.x, -5, pipeWidth, pipe.top + 5);
    ctx.strokeRect(pipe.x - capOverlap, pipe.top - capHeight, pipeWidth + (capOverlap * 2), capHeight);
    ctx.strokeRect(pipe.x, pipe.bottom, pipeWidth, H - pipe.bottom - 35);
    ctx.strokeRect(pipe.x - capOverlap, pipe.bottom, pipeWidth + (capOverlap * 2), capHeight);
  });

  // Ground
  ctx.fillStyle = '#2ecc71';
  ctx.fillRect(0, H - 35, W, 14);
  ctx.fillStyle = '#27ae60';
  ctx.fillRect(0, H - 35, W, 3);

  ctx.fillStyle = '#e67e22';
  ctx.fillRect(0, H - 21, W, 21);
  ctx.fillStyle = '#d35400';
  ctx.fillRect(0, H - 21, W, 4);

  ctx.fillStyle = '#f39c12';
  for (let x = -bushOffset; x < W + 20; x += 20) {
    ctx.beginPath();
    ctx.moveTo(x, H - 15);
    ctx.lineTo(x + 10, H - 5);
    ctx.lineTo(x + 5, H - 5);
    ctx.lineTo(x - 5, H - 15);
    ctx.fill();
  }

  // Particles
  particles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  });

  // Bird
  ctx.save();
  ctx.translate(bird.x, bird.y);

  const angle = Math.min(Math.max(bird.velocity * 0.07, -0.5), 0.7);
  ctx.rotate(angle);

  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(2, 16, 12, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f1c40f';
  ctx.beginPath();
  ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d35400';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#ff7675';
  ctx.beginPath();
  ctx.arc(-2, 4, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#e67e22';
  ctx.beginPath();
  ctx.ellipse(-5, 1 + (bird.wingAngle * 0.4), 8, 5, Math.PI / 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(5, -4, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#2c3e50';
  ctx.beginPath();
  ctx.arc(6.5, -4, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(7.5, -5.5, 1, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#e74c3c';
  ctx.beginPath();
  ctx.moveTo(bird.radius - 2, -2);
  ctx.lineTo(bird.radius + 9, 1);
  ctx.lineTo(bird.radius - 2, 5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawCloud(x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.arc(16, -10, 22, 0, Math.PI * 2);
  ctx.arc(38, -6, 16, 0, Math.PI * 2);
  ctx.arc(48, 4, 14, 0, Math.PI * 2);
  ctx.arc(20, 8, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function endGame() {
  playSound('hit');
  clearInterval(gameInterval);
  gameRunning = false;
  finalScoreEl.textContent = score;
  gameOverOverlay.classList.remove('hidden');
}

setupGame();