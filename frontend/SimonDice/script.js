const pads = [
  document.getElementById('pad-0'), // Verde
  document.getElementById('pad-1'), // Rojo
  document.getElementById('pad-2'), // Amarillo
  document.getElementById('pad-3')  // Azul
];
const startBtn = document.getElementById('startBtn');
const centerText = document.getElementById('centerText');
const scoreEl = document.getElementById('score');
const highscoreEl = document.getElementById('highscore');
const gameOverMsg = document.getElementById('gameOverMsg');

// Frecuencias para cada color (notas tipo Simon)
const frequencies = [329.63, 261.63, 220.0, 164.81]; 

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, duration = 300) {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
  osc.start();
  osc.stop(audioCtx.currentTime + duration / 1000);
}

let sequence = [];
let playerStep = 0;
let score = 0;
let highscore = 0;
let gameRunning = false;
let acceptingInput = false;

function initGame() {
  sequence = [];
  playerStep = 0;
  score = 0;
  scoreEl.textContent = score;
  highscoreEl.textContent = highscore;
  gameOverMsg.classList.add('hidden');
  gameRunning = true;
  centerText.textContent = '...';
  nextRound();
}

function nextRound() {
  playerStep = 0;
  acceptingInput = false;
  sequence.push(Math.floor(Math.random() * 4));
  centerText.textContent = sequence.length;
  setTimeout(() => playSequence(), 600);
}

function playSequence() {
  let i = 0;
  const interval = setInterval(() => {
    flashPad(sequence[i]);
    i++;
    if (i >= sequence.length) {
      clearInterval(interval);
      setTimeout(() => { acceptingInput = true; }, 500);
    }
  }, 700);
}

function flashPad(index) {
  const pad = pads[index];
  pad.classList.add('active');
  playTone(frequencies[index]);
  setTimeout(() => pad.classList.remove('active'), 300);
}

function handlePadClick(index) {
  if (!gameRunning || !acceptingInput) return;

  flashPad(index);

  if (index === sequence[playerStep]) {
    playerStep++;
    if (playerStep === sequence.length) {
      score++;
      scoreEl.textContent = score;
      acceptingInput = false;
      setTimeout(() => nextRound(), 800);
    }
  } else {
    endGame();
  }
}

pads.forEach((pad, index) => {
  pad.addEventListener('click', () => handlePadClick(index));
});

startBtn.addEventListener('click', () => {
  if (!gameRunning) initGame();
});

function endGame() {
  gameRunning = false;
  acceptingInput = false;
  if (score > highscore) {
    highscore = score;
    highscoreEl.textContent = highscore;
  }
  centerText.textContent = 'INICIAR';
  gameOverMsg.classList.remove('hidden');

  // Sonido de error
  playTone(100, 500);
}