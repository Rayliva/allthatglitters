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
    this.selectedCell = null;

    this.init();
  }

  init() {
    // Initialize empty grid
    this.grid = [];
    for (let y = 0; y < this.gridHeight; y++) {
      const row = [];
      for (let x = 0; x < this.gridWidth; x++) {
        row.push({ state: CellState.EMPTY, rune: null });
      }
      this.grid.push(row);
    }

    this.currentRune = createRune();
    this.forge = [];
    this.score = 0;
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
   * Check if a rune shares a property (color or symbol) with another rune
   */
  sharesProperty(runeA, runeB) {
    if (!runeA || !runeB) return false;
    return runeA.color === runeB.color || runeA.symbol === runeB.symbol;
  }

  /**
   * Check if placement is valid - rune must share property with at least one adjacent neighbor
   */
  canPlaceAt(x, y) {
    const cell = this.getCell(x, y);
    if (!cell || cell.state !== CellState.EMPTY || !this.currentRune) {
      return false;
    }

    const adjacent = this.getAdjacentCells(x, y);
    const hasValidNeighbor = adjacent.some((adjCell) => {
      if (adjCell.state === CellState.EMPTY) return false;
      const rune = adjCell.state === CellState.LEAD ? adjCell.rune : adjCell.rune;
      return rune && this.sharesProperty(this.currentRune, rune);
    });

    // First placement: allow anywhere if board is empty
    const isEmpty = this.grid.every(
      (row) => row.every((c) => c.state === CellState.EMPTY)
    );
    if (isEmpty) return true;

    return hasValidNeighbor;
  }

  /**
   * Place the current rune at the given position
   */
  placeRune(x, y) {
    if (!this.canPlaceAt(x, y)) return false;

    const cell = this.getCell(x, y);
    cell.state = CellState.LEAD;
    cell.rune = { ...this.currentRune };

    this.score += 10;
    this.onSuccessfulPlacement();
    this.checkAndConvertToGold();
    this.checkRowColumnBonuses();

    this.currentRune = createRune();
    this.selectedCell = null;
    return true;
  }

  /**
   * Convert cells to Gold when they form a valid connection (simplified: all placed cells become gold on next turn)
   * For this implementation: cells convert to gold when they have 2+ matching neighbors
   */
  checkAndConvertToGold() {
    const toConvert = [];
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const cell = this.getCell(x, y);
        if (cell.state !== CellState.LEAD || !cell.rune) continue;

        const adjacent = this.getAdjacentCells(x, y);
        const matchingNeighbors = adjacent.filter(
          (adj) =>
            adj.state !== CellState.EMPTY &&
            adj.rune &&
            this.sharesProperty(cell.rune, adj.rune)
        );

        if (matchingNeighbors.length >= 1) {
          toConvert.push({ x, y });
        }
      }
    }

    toConvert.forEach(({ x, y }) => {
      const cell = this.getCell(x, y);
      cell.state = CellState.GOLD;
      this.score += 5;
    });
  }

  /**
   * Check for completed rows/columns and grant bonuses
   */
  checkRowColumnBonuses() {
    const BONUS = 25;

    // Check rows
    for (let y = 0; y < this.gridHeight; y++) {
      const row = this.grid[y];
      const isFull = row.every((c) => c.state !== CellState.EMPTY);
      if (isFull) {
        this.score += BONUS;
        row.forEach((c) => {
          if (c.state === CellState.LEAD) {
            c.state = CellState.GOLD;
          }
        });
      }
    }

    // Check columns
    for (let x = 0; x < this.gridWidth; x++) {
      const col = [];
      for (let y = 0; y < this.gridHeight; y++) {
        col.push(this.getCell(x, y));
      }
      const isFull = col.every((c) => c.state !== CellState.EMPTY);
      if (isFull) {
        this.score += BONUS;
        col.forEach((c) => {
          if (c && c.state === CellState.LEAD) {
            c.state = CellState.GOLD;
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
   * Check if forge is full (game over condition)
   */
  isForgeFull() {
    return this.forge.length >= this.forgeCapacity;
  }
}
