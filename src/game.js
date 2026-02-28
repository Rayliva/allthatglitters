/**
 * Game State, grid logic, and rules engine for All That Glitters (Alchemy clone)
 */

// Cell states
export const CellState = {
  EMPTY: 'empty',
  LEAD: 'lead',
  GOLD: 'gold',
};

// Rune colors and symbols for variety
export const RUNE_COLORS = ['crimson', 'azure', 'amber', 'emerald', 'violet'];
export const RUNE_SYMBOLS = ['circle', 'triangle', 'square', 'star', 'diamond'];

/** Wild space - entirely grey, any rune can be placed next to it. Clears when row/column clears. */
export const STARTING_RUNE = { color: 'grey', symbol: 'square', isWild: true };
export const STARTING_RUNE_X = 4;
export const STARTING_RUNE_Y = 3;

/**
 * Creates a random rune with a color and symbol
 */
export function createRune() {
  return {
    color: RUNE_COLORS[Math.floor(Math.random() * RUNE_COLORS.length)],
    symbol: RUNE_SYMBOLS[Math.floor(Math.random() * RUNE_SYMBOLS.length)],
  };
}

/**
 * Game State class - manages the board, runes, forge, and scoring
 */
export class GameState {
  constructor(config = {}) {
    this.gridWidth = config.gridWidth ?? 8;
    this.gridHeight = config.gridHeight ?? 8;
    this.forgeCapacity = config.forgeCapacity ?? 5;
    this.cellSize = config.cellSize ?? 48;

    this.grid = [];
    this.currentRune = null;
    this.forge = [];
    this.score = 0;
    this.level = 1;
    this.selectedCell = null;

    this.init();
  }

  init(preserveScore = false) {
    // Initialize empty grid
    this.grid = [];
    for (let y = 0; y < this.gridHeight; y++) {
      const row = [];
      for (let x = 0; x < this.gridWidth; x++) {
        row.push({ state: CellState.EMPTY, rune: null });
      }
      this.grid.push(row);
    }

    // Place starting grey square at 5x4 (appears at beginning of every round)
    const startCell = this.getCell(STARTING_RUNE_X, STARTING_RUNE_Y);
    if (startCell) {
      startCell.rune = { ...STARTING_RUNE };
      startCell.state = CellState.LEAD;
    }

    this.currentRune = createRune();
    this.forge = [];
    if (!preserveScore) this.score = 0;
    this.selectedCell = null;
  }

  /**
   * Start a new round (next level) - clear board, keep cumulative score
   */
  startNewRound() {
    this.level += 1;
    this.init(true);
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
   * Wild spaces match any rune (any placement next to them is valid).
   */
  sharesProperty(runeA, runeB) {
    if (!runeA || !runeB) return false;
    if (runeB.isWild) return true;
    return runeA.color === runeB.color || runeA.symbol === runeB.symbol;
  }

  /**
   * Check if placement is valid - rune must share a property with EVERY adjacent neighbor that has a rune
   * Can place on EMPTY cells or GOLD cells with no rune (cleared slots)
   */
  canPlaceAt(x, y) {
    const cell = this.getCell(x, y);
    if (!cell || cell.rune !== null || !this.currentRune) {
      return false;
    }

    const adjacent = this.getAdjacentCells(x, y);
    const neighborsWithRunes = adjacent.filter((adjCell) => adjCell.rune !== null);

    // First placement: allow anywhere if board has no runes
    if (neighborsWithRunes.length === 0) {
      const hasNoRunes = this.grid.every(
        (row) => row.every((c) => c.rune === null)
      );
      return hasNoRunes;
    }

    // Every adjacent rune must share at least one property (color or symbol)
    return neighborsWithRunes.every((adjCell) =>
      this.sharesProperty(this.currentRune, adjCell.rune)
    );
  }

  /**
   * Place the current rune at the given position
   */
  placeRune(x, y) {
    if (!this.canPlaceAt(x, y)) return false;

    const cell = this.getCell(x, y);
    cell.rune = { ...this.currentRune };
    if (cell.state !== CellState.GOLD) {
      cell.state = CellState.LEAD;
    }

    this.score += 10;
    this.onSuccessfulPlacement();
    this.checkRowColumnBonuses();

    this.currentRune = createRune();
    this.selectedCell = null;
    return true;
  }

  /**
   * When a row or column is fully filled (every cell has a rune), grant bonus, clear runes, but keep gold background
   */
  checkRowColumnBonuses() {
    const BONUS = 25;

    // Check rows - only full when every cell has a rune (gold cells with no rune must be filled too)
    for (let y = 0; y < this.gridHeight; y++) {
      const row = this.grid[y];
      const isFull = row.every((c) => c.rune !== null);
      if (isFull) {
        this.score += BONUS;
        row.forEach((c) => {
          c.state = CellState.GOLD;
          c.rune = null;
        });
      }
    }

    // Check columns
    for (let x = 0; x < this.gridWidth; x++) {
      const col = [];
      for (let y = 0; y < this.gridHeight; y++) {
        col.push(this.getCell(x, y));
      }
      const isFull = col.every((c) => c && c.rune !== null);
      if (isFull) {
        this.score += BONUS;
        col.forEach((c) => {
          if (c) {
            c.state = CellState.GOLD;
            c.rune = null;
          }
        });
      }
    }
  }

  /**
   * Discard current rune to the forge
   */
  discardToForge() {
    if (!this.currentRune) return false;
    if (this.forge.length >= this.forgeCapacity) return false;

    this.forge.push(this.currentRune);
    this.currentRune = createRune();
    this.selectedCell = null;
    return true;
  }

  /**
   * Clear forge by placing runes - each successful placement removes one from forge
   */
  clearForgeSlot() {
    if (this.forge.length > 0) {
      this.forge.pop();
      return true;
    }
    return false;
  }

  /**
   * When placing a rune successfully, clear one slot from forge if it has runes
   */
  onSuccessfulPlacement() {
    this.clearForgeSlot();
  }

  /**
   * Convert screen coordinates to grid coordinates
   */
  screenToGrid(screenX, screenY, offsetX, offsetY) {
    const x = Math.floor((screenX - offsetX) / this.cellSize);
    const y = Math.floor((screenY - offsetY) / this.cellSize);
    return { x, y };
  }

  /**
   * Check if forge is full
   */
  isForgeFull() {
    return this.forge.length >= this.forgeCapacity;
  }

  /**
   * Check if the current rune can be placed anywhere on the board
   */
  hasValidPlacement() {
    if (!this.currentRune) return false;
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        if (this.canPlaceAt(x, y)) return true;
      }
    }
    return false;
  }

  /**
   * Game over: forge is full and current rune cannot be placed anywhere
   */
  isGameOver() {
    return this.isForgeFull() && !this.hasValidPlacement();
  }

  /**
   * Level complete: all cells are gold
   */
  isLevelComplete() {
    return this.grid.every((row) =>
      row.every((c) => c.state === CellState.GOLD)
    );
  }
}
