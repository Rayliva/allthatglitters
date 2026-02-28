/**
 * Entry point - initializes the game and main animation loop
 */

import { GameState } from './game.js';
import { Renderer, drawRune } from './renderer.js';
import { InputHandler } from './input.js';
import { loadHighScores, saveScore, updateEntryName, generatePlayerName } from './leaderboard.js';
import { getRanking, SKILL_LEVELS } from './constants.js';
import { playForgeSound, playLoseSound, playWinSound } from './audio.js';

const RUNE_PREVIEW_SIZE = 40;

const CELL_SIZE = 48;
const GRID_WIDTH = 9;
const GRID_HEIGHT = 8;
const FORGE_CAPACITY = 3;

const PER_PAGE = 5;

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
  document.getElementById('cursor-rune').style.visibility = 'hidden';
  document.getElementById('skill-select-modal').hidden = false;
}

function hideSkillSelectModal() {
  document.getElementById('skill-select-modal').hidden = true;
}

function renderLeaderboardList(listEl, belowEl, pageControlsEl, options = {}) {
  const { highlightDate, highlightScore, currentPlayer, page = 1 } = options;
  const scores = loadHighScores();

  // Build full ranked list for rank calculation (include current player if they didn't make it)
  let ranked = [...scores];
  let playerRank = null;
  let playerEntry = null;

  if (currentPlayer) {
    if (currentPlayer.madeList) {
      const idx = ranked.findIndex((e) => e.date === currentPlayer.date && e.score === currentPlayer.score);
      if (idx >= 0) {
        playerRank = idx + 1;
        playerEntry = { ...ranked[idx], name: currentPlayer.name ?? ranked[idx].name };
      }
    } else {
      // Didn't make list: add virtual entry to compute rank
      const virtual = { score: currentPlayer.score, date: null, name: 'You' };
      ranked.push(virtual);
      ranked.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
      playerRank = ranked.findIndex((e) => e === virtual) + 1;
      playerEntry = virtual;
    }
  }

  const totalPages = Math.max(1, Math.ceil(ranked.length / PER_PAGE));
  const safePage = Math.max(1, Math.min(page, totalPages));
  const startIdx = (safePage - 1) * PER_PAGE;
  const toShow = ranked.slice(startIdx, startIdx + PER_PAGE);
  const playerOnCurrentPage = playerEntry && playerRank >= startIdx + 1 && playerRank <= startIdx + toShow.length;

  // List entries
  listEl.innerHTML = '';
  if (toShow.length === 0) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'No scores yet';
    listEl.appendChild(li);
  } else {
    toShow.forEach((entry, i) => {
      const li = document.createElement('li');
      li.dataset.date = entry.date ?? '';
      li.dataset.score = String(entry.score ?? 0);
      const rank = startIdx + i + 1;
      const rankSpan = document.createElement('span');
      rankSpan.className = 'leaderboard-rank';
      rankSpan.textContent = `${rank}.`;
      const name = entry.name || 'Anonymous';
      const nameSpan = document.createElement('span');
      nameSpan.className = 'leaderboard-name';
      nameSpan.textContent = name;
      const scoreSpan = document.createElement('span');
      scoreSpan.className = 'leaderboard-score';
      scoreSpan.textContent = String(entry.score);
      li.appendChild(rankSpan);
      li.appendChild(nameSpan);
      li.appendChild(scoreSpan);
      const isCurrentPlayer = playerEntry && (
        entry === playerEntry ||
        (currentPlayer?.madeList && entry.date === currentPlayer.date && entry.score === currentPlayer.score)
      );
      if (isCurrentPlayer) {
        li.classList.add('leaderboard-current-player');
      }
      if (highlightDate && highlightScore && entry.date === highlightDate && entry.score === highlightScore) {
        li.classList.add('name-updated');
      }
      listEl.appendChild(li);
    });
  }

  // Only show user's score on the page they're on (no "below the line")
  belowEl.innerHTML = '';

  // Page controls
  pageControlsEl.innerHTML = '';
  if (ranked.length > PER_PAGE) {
    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'leaderboard-page-btn';
    prevBtn.textContent = '← Prev';
    prevBtn.disabled = safePage <= 1;
    prevBtn.onclick = () => options.onPageChange?.(safePage - 1);

    const pageInfo = document.createElement('span');
    pageInfo.className = 'leaderboard-page-info';
    pageInfo.textContent = `${startIdx + 1}–${Math.min(startIdx + PER_PAGE, ranked.length)} of ${ranked.length}`;

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'leaderboard-page-btn';
    nextBtn.textContent = 'Next →';
    nextBtn.disabled = safePage >= totalPages;
    nextBtn.onclick = () => options.onPageChange?.(safePage + 1);

    pageControlsEl.appendChild(prevBtn);
    pageControlsEl.appendChild(pageInfo);
    pageControlsEl.appendChild(nextBtn);
  }
}

function showGameOverModal(gameState) {
  playLoseSound();
  const score = gameState.score;
  const randomName = generatePlayerName();
  const { madeList, date } = saveScore(score, randomName);

  const modal = document.getElementById('game-over-modal');
  document.getElementById('final-score').textContent = score;
  const { title } = getRanking(score);
  document.getElementById('final-ranking').textContent = title;

  const nameEntryEl = document.querySelector('.name-entry');
  const nameInput = document.getElementById('highscore-name');
  const nameSaveBtn = document.getElementById('highscore-save-btn');
  nameInput.value = randomName;
  nameInput.placeholder = 'Enter your name';
  nameEntryEl.hidden = !madeList;

  const listEl = document.getElementById('leaderboard-list');
  const belowEl = document.getElementById('leaderboard-below');
  const pageControlsEl = document.getElementById('leaderboard-pages');

  const getCurrentPlayer = () => ({
    score,
    date: madeList ? date : null,
    name: nameInput.value.trim(),
    madeList,
  });

  // Start on player's page (whether they made the list or not)
  const scores = loadHighScores();
  let ranked = [...scores];
  if (!madeList) {
    const virtual = { score, date: null, name: 'You' };
    ranked.push(virtual);
    ranked.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }
  const playerIdx = madeList && date
    ? ranked.findIndex((e) => e.date === date && e.score === score)
    : ranked.findIndex((e) => e.name === 'You' && e.score === score);
  const initialPage = playerIdx >= 0 ? Math.floor(playerIdx / PER_PAGE) + 1 : 1;

  let currentPage = initialPage;

  const doRender = (animate = false) => {
    if (animate && madeList && date) {
      const idx = scores.findIndex((e) => e.date === date && e.score === score);
      if (idx >= 0) currentPage = Math.floor(idx / PER_PAGE) + 1;
    }
    renderLeaderboardList(listEl, belowEl, pageControlsEl, {
      highlightDate: animate ? date : null,
      highlightScore: animate ? score : null,
      currentPlayer: getCurrentPlayer(),
      page: currentPage,
      onPageChange: (newPage) => {
        currentPage = newPage;
        doRender(false);
      },
    });
  };

  doRender();

  if (madeList && date) {
    const updateDisplay = (animate = false) => {
      const name = nameInput.value.trim();
      if (updateEntryName(score, date, name)) {
        doRender(animate);
      }
    };
    const triggerSave = () => {
      nameInput.blur();
    };
    nameInput.oninput = () => updateDisplay(false);
    nameInput.onblur = () => updateDisplay(true);
    nameInput.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        triggerSave();
      }
    };
    nameSaveBtn.onclick = triggerSave;
  } else {
    nameInput.oninput = null;
    nameInput.onblur = null;
    nameInput.onkeydown = null;
    nameSaveBtn.onclick = null;
  }

  document.getElementById('cursor-rune').style.visibility = 'hidden';
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
      showGameOverModal(gameState);
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
