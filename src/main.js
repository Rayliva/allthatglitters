/**
 * Entry point - initializes the game and main animation loop
 */

import { GameState } from './game.js';
import { Renderer, drawRune } from './renderer.js';
import { InputHandler } from './input.js';

const RUNE_PREVIEW_SIZE = 40;

const CELL_SIZE = 48;
const GRID_WIDTH = 8;
const GRID_HEIGHT = 8;

function createRuneCanvas(rune, size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#16213e';
  ctx.fillRect(0, 0, size, size);
  drawRune(ctx, 0, 0, size, rune);
  return canvas;
}

function init() {
  const canvas = document.getElementById('game-canvas');
  const scoreEl = document.getElementById('score');
  const runeDisplayEl = document.getElementById('rune-display');
  const forgeDisplayEl = document.getElementById('forge-display');

  const gameState = new GameState({
    gridWidth: GRID_WIDTH,
    gridHeight: GRID_HEIGHT,
    cellSize: CELL_SIZE,
    forgeCapacity: 5,
  });

  const renderer = new Renderer(canvas, gameState);

  function updateUI() {
    scoreEl.textContent = gameState.score;

    // Current rune
    runeDisplayEl.innerHTML = '';
    if (gameState.currentRune) {
      const runeEl = createRuneCanvas(gameState.currentRune, RUNE_PREVIEW_SIZE);
      runeEl.className = 'rune-preview';
      runeDisplayEl.appendChild(runeEl);
    }

    // Forge
    forgeDisplayEl.innerHTML = '';
    for (let i = 0; i < gameState.forgeCapacity; i++) {
      const slot = document.createElement('div');
      slot.className = 'forge-slot';
      if (i < gameState.forge.length) {
        const r = gameState.forge[i];
        const runeCanvas = createRuneCanvas(r, 28);
        slot.appendChild(runeCanvas);
        slot.classList.add('filled');
      }
      forgeDisplayEl.appendChild(slot);
    }
  }

  const inputHandler = new InputHandler(canvas, gameState, renderer, () => {
    updateUI();
  });

  document.getElementById('discard-btn')?.addEventListener('click', () => {
    if (gameState.discardToForge()) updateUI();
  });

  // Resize and initial render
  function resize() {
    renderer.resize();
    renderer.render();
  }

  window.addEventListener('resize', resize);
  resize();

  // Animation loop
  function gameLoop() {
    renderer.render();
    updateUI();
    requestAnimationFrame(gameLoop);
  }
  gameLoop();
}

init();
