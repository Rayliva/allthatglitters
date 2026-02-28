/**
 * Canvas renderer for All That Glitters
 */

import { CellState } from './game.js';
import { ZODIAC_UNICODE } from './constants.js';

// Color mapping for rune colors
export const COLOR_MAP = {
  crimson: '#dc2626',
  azure: '#2563eb',
  amber: '#d97706',
  emerald: '#059669',
  violet: '#7c3aed',
  grey: '#6b7280',
  coral: '#ea580c',
  teal: '#0d9488',
  rose: '#e11d48',
};

/**
 * Draw a rune to a 2D context (zodiac symbols, wild, skull)
 */
export function drawRune(ctx, px, py, size, rune) {
  const cx = px + size / 2;
  const cy = py + size / 2;

  if (rune.isSkull) {
    drawSkull(ctx, cx, cy, size);
    return;
  }

  if (rune.isWild) {
    ctx.fillStyle = COLOR_MAP.grey || '#6b7280';
    ctx.fillRect(px, py, size, size);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py, size, size);
    return;
  }

  const color = COLOR_MAP[rune.color] || '#888';
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  // Draw zodiac symbol as Unicode glyph
  const symbol = rune.symbol;
  if (symbol && ZODIAC_UNICODE[symbol]) {
    const char = ZODIAC_UNICODE[symbol];
    ctx.font = `bold ${size * 0.7}px "Segoe UI Symbol", "Arial Unicode MS", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(char, cx, cy);
    ctx.strokeText(char, cx, cy);
  } else {
    // Fallback circle
    ctx.beginPath();
    ctx.arc(cx, cy, size / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

function drawSkull(ctx, cx, cy, size) {
  const r = size / 3;
  ctx.fillStyle = '#e5e7eb';
  ctx.strokeStyle = '#9ca3af';
  ctx.lineWidth = 1;

  // Skull shape (simplified)
  ctx.beginPath();
  ctx.arc(cx, cy - r * 0.3, r * 0.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Eye sockets
  ctx.fillStyle = '#374151';
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.35, cy - r * 0.4, r * 0.2, r * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + r * 0.35, cy - r * 0.4, r * 0.2, r * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();

  // Crossbones - X shape
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = Math.max(1, size / 24);
  ctx.beginPath();
  ctx.moveTo(cx - r, cy + r * 0.2);
  ctx.lineTo(cx + r, cy + r * 0.8);
  ctx.moveTo(cx + r, cy + r * 0.2);
  ctx.lineTo(cx - r, cy + r * 0.8);
  ctx.stroke();
}

export class Renderer {
  constructor(canvas, gameState) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.gameState = gameState;
    this.cellSize = gameState.cellSize;
    this.padding = 16;
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;

    this.ctx.scale(dpr, dpr);
    this.width = rect.width;
    this.height = rect.height;
  }

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    const boardWidth =
      this.gameState.gridWidth * this.cellSize + this.padding * 2;
    const boardHeight =
      this.gameState.gridHeight * this.cellSize + this.padding * 2;
    const offsetX = (this.width - boardWidth) / 2 + this.padding;
    const offsetY = (this.height - boardHeight) / 2 + this.padding;

    this.renderBoard(offsetX, offsetY);
    this.renderCells(offsetX, offsetY);
    this.renderGridOverlay(offsetX, offsetY);
  }

  renderBoard(offsetX, offsetY) {
    const w = this.gameState.gridWidth * this.cellSize;
    const h = this.gameState.gridHeight * this.cellSize;

    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.beginPath();
    this.roundRect(this.ctx, offsetX - 4, offsetY - 4, w + 8, h + 8, 12);
    this.ctx.fill();

    this.ctx.strokeStyle = '#4a4a6a';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }

  roundRect(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
  }

  renderCells(offsetX, offsetY) {
    const { grid, selectedCell } = this.gameState;

    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const cell = grid[y][x];
        const px = offsetX + x * this.cellSize;
        const py = offsetY + y * this.cellSize;
        const isSelected = selectedCell && selectedCell.x === x && selectedCell.y === y;
        const isSkullTarget = this.gameState.currentRune?.isSkull && this.gameState.canSkullRemoveAt(x, y);

        this.renderCell(px, py, cell, isSelected, isSkullTarget);
      }
    }
  }

  renderCell(px, py, cell, isSelected, isSkullTarget) {
    const size = this.cellSize - 2;
    const margin = 1;

    if (cell.state === CellState.EMPTY) {
      this.ctx.fillStyle = '#16213e';
    } else if (cell.state === CellState.LEAD) {
      this.ctx.fillStyle = '#3d3d5c';
    } else {
      this.ctx.fillStyle = '#b8860b';
    }

    this.ctx.fillRect(px + margin, py + margin, size, size);

    if (isSelected) {
      this.ctx.strokeStyle = '#fbbf24';
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(px + margin, py + margin, size, size);
    }
    if (isSkullTarget) {
      this.ctx.strokeStyle = '#ef4444';
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(px + margin, py + margin, size, size);
    }

    if (cell.rune) {
      if (cell.rune.isWild) {
        this.ctx.fillStyle = '#6b7280';
        this.ctx.fillRect(px + margin, py + margin, size, size);
        this.ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(px + margin, py + margin, size, size);
      } else {
        drawRune(this.ctx, px + margin, py + margin, size, cell.rune);
      }
    }
  }

  renderGridOverlay(offsetX, offsetY) {
    this.ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    this.ctx.lineWidth = 1;

    for (let i = 0; i <= this.gameState.gridWidth; i++) {
      const x = offsetX + i * this.cellSize;
      this.ctx.beginPath();
      this.ctx.moveTo(x, offsetY);
      this.ctx.lineTo(x, offsetY + this.gameState.gridHeight * this.cellSize);
      this.ctx.stroke();
    }
    for (let i = 0; i <= this.gameState.gridHeight; i++) {
      const y = offsetY + i * this.cellSize;
      this.ctx.beginPath();
      this.ctx.moveTo(offsetX, y);
      this.ctx.lineTo(offsetX + this.gameState.gridWidth * this.cellSize, y);
      this.ctx.stroke();
    }
  }

  getBoardOffset() {
    const boardWidth =
      this.gameState.gridWidth * this.cellSize + this.padding * 2;
    const boardHeight =
      this.gameState.gridHeight * this.cellSize + this.padding * 2;
    return {
      x: (this.width - boardWidth) / 2 + this.padding,
      y: (this.height - boardHeight) / 2 + this.padding,
    };
  }
}
