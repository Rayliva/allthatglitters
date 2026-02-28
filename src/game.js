/**
 * Game State, grid logic, and rules engine for All That Glitters (Alchemy clone)
 */

import {
  ZODIAC_SYMBOLS,
  RUNE_COLORS,
  getSymbolCountForBoard,
  getColorCountForBoard,
  getPlacementPoints,
  getRowClearPoints,
  getBoardClearPoints,
  WILD_CHANCE,
  SKULL_CHANCE,
} from './constants.js';

// Cell states
export const CellState = {
  EMPTY: 'empty',
  LEAD: 'lead',
  GOLD: 'gold',
};

/** Wild space - solid block, any rune can be placed next to it */
export const STARTING_RUNE = { color: 'grey', symbol: 'wild', isWild: true };
export const STARTING_RUNE_X = 4;
export const STARTING_RUNE_Y = 3;

/** Skull rune - removes a rune of choice from the board */
export const SKULL_RUNE = { isSkull: true };

/**
 * Creates a random rune based on current board. May return wild or skull.
 */
export function createRune(board = 1) {
  const r = Math.random();
  if (r < WILD_CHANCE) {
    return { color: 'grey', symbol: 'wild', isWild: true };
  }
  if (r < WILD_CHANCE + SKULL_CHANCE) {
    return { ...SKULL_RUNE };
  }

  const symbolCount = getSymbolCountForBoard(board);
  const colorCount = getColorCountForBoard(board);
  return {
    color: RUNE_COLORS[Math.floor(Math.random() * colorCount)],
    symbol: ZODIAC_SYMBOLS[Math.floor(Math.random() * symbolCount)],
  };
}

/**
 * Game State class - manages the board, runes, forge, and scoring
 */
export class GameState {
  constructor(config = {}) {
    this.gridWidth = config.gridWidth ?? 8;
    this.gridHeight = config.gridHeight ?? 8;
    this.forgeCapacity = config.forgeCapacity ?? 3;
    this.cellSize = config.cellSize ?? 48;
    this.skillLevel = config.skillLevel ?? 1;
    this.startBoard = config.startBoard ?? 1;

    this.grid = [];
    this.currentRune = null;
    this.forge = [];
    this.score = 0;
    this.board = this.startBoard; // Current board number (1-indexed)
    this.selectedCell = null;
    this.placementStreak = 0;
    this.maxPlacementStreak = 0;
    this.boardsCleared = 0;
    this.gameStartTime = null;
    this.init();
  }

  init(preserveScore = false) {
    // Initialize grid - all cells start as LEAD (spec: "squares turn back to lead")
    this.grid = [];
    for (let y = 0; y < this.gridHeight; y++) {
      const row = [];
      for (let x = 0; x < this.gridWidth; x++) {
        row.push({ state: CellState.LEAD, rune: null });
      }
      this.grid.push(row);
    }

    // Place starting wild at center
    const startCell = this.getCell(STARTING_RUNE_X, STARTING_RUNE_Y);
    if (startCell) {
      startCell.rune = { ...STARTING_RUNE };
    }

    this.currentRune = createRune(this.board);
    this.forge = [];
    if (!preserveScore) {
      this.score = 0;
      this.board = this.startBoard;
      this.placementStreak = 0;
      this.maxPlacementStreak = 0;
      this.boardsCleared = 0;
      this.gameStartTime = Date.now();
    }
    this.selectedCell = null;
  }

  /**
   * Start a new round (next board) - clear board, keep cumulative score
   */
  startNewRound() {
    this.board += 1;
    // Reset grid to lead with no runes
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const cell = this.grid[y][x];
        cell.state = CellState.LEAD;
        cell.rune = null;
      }
    }
    // Place starting wild
    const startCell = this.getCell(STARTING_RUNE_X, STARTING_RUNE_Y);
    if (startCell) {
      startCell.rune = { ...STARTING_RUNE };
    }
    // Board clear: lower forge by one level (does not empty)
    if (this.forge.length > 0) {
      this.forge.pop();
    }
    this.currentRune = createRune(this.board);
    this.selectedCell = null;
  }

  /**
   * Get cell at grid coordinates
   */
  getCell(x, y) {
    if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) {
      return null;
    }
    return this.grid[y][x];
  }

  /**
   * Get adjacent cells (horizontal/vertical only)
   */
  getAdjacentCells(x, y) {
    const directions = [
      [-1, 0], [1, 0], [0, -1], [0, 1],
    ];
    return directions
      .map(([dx, dy]) => this.getCell(x + dx, y + dy))
      .filter(Boolean);
  }

  /**
   * Check if a rune shares a property (color or symbol) with another rune.
   * Wild spaces match any rune.
   */
  sharesProperty(runeA, runeB) {
    if (!runeA || !runeB) return false;
    if (runeB.isWild) return true;
    if (runeA.isWild) return true;
    if (runeA.isSkull || runeB.isSkull) return false;
    return runeA.color === runeB.color || runeA.symbol === runeB.symbol;
  }

  /**
   * Check if placement is valid. Wild can go anywhere when board is empty.
   */
  canPlaceAt(x, y) {
    const cell = this.getCell(x, y);
    if (!cell || !this.currentRune) return false;

    // Skull is not placed - it's used to remove a rune
    if (this.currentRune.isSkull) return false;

    // Can't place on cell that already has a rune
    if (cell.rune !== null) return false;

    const adjacent = this.getAdjacentCells(x, y);
    const neighborsWithRunes = adjacent.filter((adjCell) => adjCell.rune !== null);

    // Must be adjacent to at least one rune, unless board is totally blank (spec)
    if (neighborsWithRunes.length === 0) {
      const hasNoRunes = this.countRunesOnBoard() === 0;
      if (hasNoRunes) return true; // Board totally blank, place anywhere
      return false; // Need adjacency
    }

    // Every adjacent rune must share at least one property
    return neighborsWithRunes.every((adjCell) =>
      this.sharesProperty(this.currentRune, adjCell.rune)
    );
  }

  countRunesOnBoard() {
    let count = 0;
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        if (this.grid[y][x].rune) count++;
      }
    }
    return count;
  }

  /**
   * Place the current rune at the given position
   * @returns {{ placed: boolean, rowColumnCleared: boolean }}
   */
  placeRune(x, y) {
    if (!this.canPlaceAt(x, y)) return { placed: false, rowColumnCleared: false };

    const cell = this.getCell(x, y);
    cell.rune = { ...this.currentRune };

    const pts = getPlacementPoints(this.board);
    this.score += pts;
    this.placementStreak += 1;
    if (this.placementStreak > this.maxPlacementStreak) {
      this.maxPlacementStreak = this.placementStreak;
    }

    this.onSuccessfulPlacement();
    const rowColumnCleared = this.checkRowColumnBonuses();

    this.currentRune = createRune(this.board);
    this.selectedCell = null;
    return { placed: true, rowColumnCleared };
  }

  /**
   * When a row or column is fully filled, grant bonus, clear runes, set gold, EMPTY FORGE
   * @returns {boolean} Whether any row or column was cleared
   */
  checkRowColumnBonuses() {
    const BONUS = getRowClearPoints(this.board);
    let anyCleared = false;

    for (let y = 0; y < this.gridHeight; y++) {
      const row = this.grid[y];
      const isFull = row.every((c) => c.rune !== null);
      if (isFull) {
        this.score += BONUS;
        anyCleared = true;
        row.forEach((c) => {
          c.state = CellState.GOLD;
          c.rune = null;
        });
      }
    }

    for (let x = 0; x < this.gridWidth; x++) {
      const col = [];
      for (let y = 0; y < this.gridHeight; y++) {
        col.push(this.getCell(x, y));
      }
      const isFull = col.every((c) => c && c.rune !== null);
      if (isFull) {
        this.score += BONUS;
        anyCleared = true;
        col.forEach((c) => {
          if (c) {
            c.state = CellState.GOLD;
            c.rune = null;
          }
        });
      }
    }

    // Row/column clear empties the forge
    if (anyCleared) {
      this.forge = [];
    }

    // Rare: all runes cleared without full gold -> give wild (spec)
    if (anyCleared && this.countRunesOnBoard() === 0 && !this.isLevelComplete()) {
      this.currentRune = { color: 'grey', symbol: 'wild', isWild: true };
    }
    return anyCleared;
  }

  /**
   * Use skull to remove a rune at (x, y). Lowers forge by one.
   */
  useSkullToRemove(x, y) {
    if (!this.currentRune?.isSkull) return false;
    const cell = this.getCell(x, y);
    if (!cell || !cell.rune || cell.rune.isWild) return false;

    cell.rune = null;
    this.currentRune = createRune(this.board);
    // Skull use lowers forge one level
    if (this.forge.length > 0) {
      this.forge.pop();
    }
    return true;
  }

  /**
   * Discard current rune to the forge
   */
  discardToForge() {
    if (!this.currentRune) return false;
    if (this.forge.length >= this.forgeCapacity) return false;

    this.forge.push(this.currentRune);
    this.currentRune = createRune(this.board);
    this.selectedCell = null;
    this.placementStreak = 0;
    return true;
  }

  /**
   * Each successful placement removes one from forge
   */
  onSuccessfulPlacement() {
    if (this.forge.length > 0) {
      this.forge.pop();
    }
  }

  screenToGrid(screenX, screenY, offsetX, offsetY) {
    const x = Math.floor((screenX - offsetX) / this.cellSize);
    const y = Math.floor((screenY - offsetY) / this.cellSize);
    return { x, y };
  }

  isForgeFull() {
    return this.forge.length >= this.forgeCapacity;
  }

  hasValidPlacement() {
    if (!this.currentRune) return false;
    if (this.currentRune.isSkull) {
      // Skull can be used if there's a removable rune (non-wild)
      for (let y = 0; y < this.gridHeight; y++) {
        for (let x = 0; x < this.gridWidth; x++) {
          if (this.canSkullRemoveAt(x, y)) return true;
        }
      }
      return false;
    }
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        if (this.canPlaceAt(x, y)) return true;
      }
    }
    return false;
  }

  /**
   * Can skull remove a rune at (x,y)?
   */
  canSkullRemoveAt(x, y) {
    if (!this.currentRune?.isSkull) return false;
    const cell = this.getCell(x, y);
    return cell && cell.rune && !cell.rune.isWild;
  }

  isGameOver() {
    return this.isForgeFull() && !this.hasValidPlacement();
  }

  /**
   * Level/board complete: all cells are gold
   */
  isLevelComplete() {
    return this.grid.every((row) =>
      row.every((c) => c.state === CellState.GOLD)
    );
  }

  /**
   * When completing a board: add board clear bonus, track stats
   */
  completeBoard() {
    this.score += getBoardClearPoints(this.board);
    this.boardsCleared += 1;
  }

  getGameTimeSeconds() {
    if (!this.gameStartTime) return 0;
    return Math.floor((Date.now() - this.gameStartTime) / 1000);
  }
}
