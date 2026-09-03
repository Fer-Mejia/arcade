const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const GRID_SIZE = 18; // 18x18 celdas en canvas de 360px (20px por celda)
const TILE_SIZE = canvas.width / GRID_SIZE;

// Dibuja el fondo plano verde con patrón de cuadrícula suave retro v1
function drawGrid() {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? "#20bf6b" : "#26de81";
      ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }
}

// Función principal de renderizado (Llamada dentro del loop de tu juego)
function draw() {
  // 1. Limpiar/Dibujar tablero
  drawGrid();

  // 2. Dibujar Comida (Manzana Roja Arcade)
  if (food) {
    ctx.fillStyle = "#eb4d4b";
    ctx.fillRect(
      food.x * TILE_SIZE + 1,
      food.y * TILE_SIZE + 1,
      TILE_SIZE - 2,
      TILE_SIZE - 2
    );
  }

  // 3. Dibujar Serpiente (Cabeza Amarilla + Cuerpo Blanco v1)
  snake.forEach((segment, index) => {
    if (index === 0) {
      ctx.fillStyle = "#f1c40f"; // Cabeza
    } else {
      ctx.fillStyle = "#ffffff"; // Cuerpo
    }
    ctx.fillRect(
      segment.x * TILE_SIZE + 1,
      segment.y * TILE_SIZE + 1,
      TILE_SIZE - 2,
      TILE_SIZE - 2
    );
  });
}