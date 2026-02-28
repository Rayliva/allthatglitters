/**
 * Entry point - initializes the game and main animation loop
 */

import { GameState } from './game.js';
import { Renderer, drawRune } from './renderer.js';
import { InputHandler } from './input.js';
import { loadHighScores, saveScore } from './leaderboard.js';
import { getRanking, SKILL_LEVELS } from './constants.js';
import { playForgeSound, playLoseSound, playWinSound } from './audio.js';

const RUNE_PREVIEW_SIZE = 40;

const CELL_SIZE = 48;
const GRID_WIDTH = 9;
const GRID_HEIGHT = 8;
const FORGE_CAPACITY = 3;

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

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

function showSkillSelectModal() {
  document.getElementById('skill-select-modal').hidden = false;
}

function hideSkillSelectModal() {
  document.getElementById('skill-select-modal').hidden = true;
}

function showGameOverModal(score) {
  playLoseSound();
  saveScore(score);
  const modal = document.getElementById('game-over-modal');
  document.getElementById('final-score').textContent = score;
  const { title } = getRanking(score);
  document.getElementById('final-ranking').textContent = title;

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

function showLevelCompleteModal(gameState) {
  playWinSound();
  gameState.completeBoard();

  const { title, nextAt } = getRanking(gameState.score);
  document.getElementById('next-level').textContent = gameState.board + 1;
  document.getElementById('current-ranking').textContent = title;
  document.getElementById('next-rank-score').textContent = nextAt ? nextAt : '—';
  document.getElementById('game-time').textContent = formatTime(gameState.getGameTimeSeconds());
  document.getElementById('boards-cleared').textContent = gameState.boardsCleared;
  document.getElementById('max-streak').textContent = gameState.maxPlacementStreak;

  document.getElementById('level-complete-modal').hidden = false;
}

function hideLevelCompleteModal() {
  document.getElementById('level-complete-modal').hidden = true;
}

function createGameState(skillLevel) {
  const { startBoard } = SKILL_LEVELS[skillLevel] || SKILL_LEVELS[1];
  return new GameState({
    gridWidth: GRID_WIDTH,
    gridHeight: GRID_HEIGHT,
    cellSize: CELL_SIZE,
    forgeCapacity: FORGE_CAPACITY,
    skillLevel,
    startBoard,
  });
}

function startGame(skillLevel) {
  hideSkillSelectModal();

  const canvas = document.getElementById('game-canvas');
  const scoreEl = document.getElementById('score');
  const boardEl = document.getElementById('board');
  const cursorRuneEl = document.getElementById('cursor-rune');
  const forgeDisplayEl = document.getElementById('forge-display');

  let gameState = createGameState(skillLevel);
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
      showLevelCompleteModal(gameState);
    }
  }

  function updateUI() {
    if (gameOver || levelComplete) return;
    boardEl.textContent = gameState.board;
    scoreEl.textContent = gameState.score;

    cursorRuneEl.innerHTML = '';
    if (gameState.currentRune) {
      const runeEl = createRuneCanvas(gameState.currentRune, RUNE_PREVIEW_SIZE);
      cursorRuneEl.appendChild(runeEl);
      cursorRuneEl.style.visibility = 'visible';
    } else {
      cursorRuneEl.style.visibility = 'hidden';
    }

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

  document.addEventListener('mousemove', function moveHandler(e) {
    cursorRuneEl.style.left = `${e.clientX}px`;
    cursorRuneEl.style.top = `${e.clientY}px`;
  });

  // Use onclick to replace handlers (avoids duplicates on restart)
  document.getElementById('discard-btn').onclick = () => {
    if (gameOver || levelComplete) return;
    if (gameState.discardToForge()) {
      playForgeSound();
      onAction();
    }
  };

  document.getElementById('continue-btn').onclick = () => {
    hideLevelCompleteModal();
    levelComplete = false;
    gameState.startNewRound();
    renderer = new Renderer(canvas, gameState);
    renderer.resize();
    renderer.render();
    inputHandler = new InputHandler(canvas, gameState, renderer, onAction);
    updateUI();
  };

  document.getElementById('restart-btn').onclick = () => {
    hideGameOverModal();
    gameOver = false;
    inputHandler?.destroy();
    showSkillSelectModal();
  };

  function resize() {
    renderer.resize();
    renderer.render();
  }

  window.addEventListener('resize', resize);
  resize();

  function gameLoop() {
    renderer.render();
    if (!gameOver && !levelComplete) updateUI();
    requestAnimationFrame(gameLoop);
  }
  gameLoop();
}

function init() {
  showSkillSelectModal();

  document.querySelectorAll('.skill-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const skillLevel = parseInt(btn.dataset.skill, 10);
      startGame(skillLevel);
    });
  });
}

init();
