/**
 * Entry point - initializes the game and main animation loop
 */

import { GameState } from './game.js';
import { Renderer, drawRune } from './renderer.js';
import { InputHandler } from './input.js';
import { loadHighScores, saveScore } from './leaderboard.js';

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

function showGameOverModal(score) {
  saveScore(score);
  const modal = document.getElementById('game-over-modal');
  document.getElementById('final-score').textContent = score;

  const listEl = document.getElementById('leaderboard-list');
  listEl.innerHTML = '';
  const scores = loadHighScores();
  if (scores.length === 0) {
    listEl.innerHTML = '<li class="empty">No scores yet</li>';
  } else {
    scores.forEach((entry, i) => {
      const li = document.createElement('li');
      li.textContent = `${i + 1}. ${entry.score}`;
      listEl.appendChild(li);
    });
  }

  modal.hidden = false;
}

function hideGameOverModal() {
  document.getElementById('game-over-modal').hidden = true;
}

function showLevelCompleteModal(nextLevel) {
  document.getElementById('next-level').textContent = nextLevel;
  document.getElementById('level-complete-modal').hidden = false;
}

function hideLevelCompleteModal() {
  document.getElementById('level-complete-modal').hidden = true;
}

function init() {
  const canvas = document.getElementById('game-canvas');
  const scoreEl = document.getElementById('score');
  const runeDisplayEl = document.getElementById('rune-display');
  const forgeDisplayEl = document.getElementById('forge-display');

  let gameState = new GameState({
    gridWidth: GRID_WIDTH,
    gridHeight: GRID_HEIGHT,
    cellSize: CELL_SIZE,
    forgeCapacity: 5,
  });

  let renderer = new Renderer(canvas, gameState);
  let inputHandler = null;
  let gameOver = false;
  let levelComplete = false;

  function checkGameOver() {
    if (gameState.isGameOver()) {
      gameOver = true;
      inputHandler?.destroy();
      showGameOverModal(gameState.score);
    }
  }

  function checkLevelComplete() {
    if (gameState.isLevelComplete()) {
      levelComplete = true;
      inputHandler?.destroy();
      showLevelCompleteModal(gameState.level + 1);
    }
  }

  function updateUI() {
    if (gameOver || levelComplete) return;
    document.getElementById('level').textContent = gameState.level;
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

  function onAction() {
    updateUI();
    checkLevelComplete();
    checkGameOver();
  }

  inputHandler = new InputHandler(canvas, gameState, renderer, onAction);

  document.getElementById('discard-btn')?.addEventListener('click', () => {
    if (gameOver || levelComplete) return;
    if (gameState.discardToForge()) onAction();
  });

  document.getElementById('continue-btn')?.addEventListener('click', () => {
    hideLevelCompleteModal();
    levelComplete = false;
    gameState.startNewRound();
    renderer = new Renderer(canvas, gameState);
    renderer.resize();
    renderer.render();
    inputHandler = new InputHandler(canvas, gameState, renderer, onAction);
    updateUI();
  });

  document.getElementById('restart-btn')?.addEventListener('click', () => {
    hideGameOverModal();
    gameOver = false;
    inputHandler?.destroy();

    gameState = new GameState({
      gridWidth: GRID_WIDTH,
      gridHeight: GRID_HEIGHT,
      cellSize: CELL_SIZE,
      forgeCapacity: 5,
    });
    renderer = new Renderer(canvas, gameState);
    renderer.resize();
    renderer.render();
    inputHandler = new InputHandler(canvas, gameState, renderer, onAction);
    updateUI();
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
    if (!gameOver && !levelComplete) updateUI();
    requestAnimationFrame(gameLoop);
  }
  gameLoop();
}

init();
