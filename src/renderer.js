/**
 * Canvas renderer for All That Glitters
 */

import { CellState } from './game.js';

// Color mapping for rune colors (exported for rune preview)
export const COLOR_MAP = {
  crimson: '#dc2626',
  azure: '#2563eb',
  amber: '#d97706',
  emerald: '#059669',
  violet: '#7c3aed',
};

function drawStar(ctx, cx, cy, spikes, outerR, innerR) {
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const x = cx + Math.cos(rot) * r;
    const y = cy + Math.sin(rot) * r;
    ctx[i === 0 ? 'moveTo' : 'lineTo'](x, y);
    rot += step;
  }
  ctx.closePath();
}

/**
 * Draw a rune to a 2D context (used by board and sidebar)
 */
export function drawRune(ctx, px, py, size, rune) {
  const color = COLOR_MAP[rune.color] || '#888';
  const cx = px + size / 2;
  const cy = py + size / 2;
  const r = size / 4;

  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  switch (rune.symbol) {
    case 'circle':
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    case 'triangle':
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx - r, cy + r);
      ctx.lineTo(cx + r, cy + r);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case 'square':
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      ctx.strokeRect(cx - r, cy - r, r * 2, r * 2);
      break;
    case 'star':
      drawStar(ctx, cx, cy, 5, r, r * 0.5);
      ctx.fill();
      ctx.stroke();
      break;
    case 'diamond':
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r, cy);
      ctx.lineTo(cx, cy + r);
      ctx.lineTo(cx - r, cy);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    default:
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
  }
}

export class Renderer {
  constructor(canvas, gameState) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.gameState = gameState;
    this.cellSize = gameState.cellSize;
    this.padding = 16;
  }

  /**
   * Resize canvas to match game dimensions
   */
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

  /**
   * Main render loop
   */
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

  /**
   * Draw the board background
   */
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

  /**
   * Draw all cells
   */
  renderCells(offsetX, offsetY) {
    const { grid, selectedCell } = this.gameState;

    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const cell = grid[y][x];
        const px = offsetX + x * this.cellSize;
        const py = offsetY + y * this.cellSize;
        const isSelected = selectedCell && selectedCell.x === x && selectedCell.y === y;

        this.renderCell(px, py, cell, isSelected);
      }
    }
  }

  /**
   * Draw a single cell
   */
  renderCell(px, py, cell, isSelected) {
    const size = this.cellSize - 2;
    const margin = 1;

    // Cell background
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

    if (cell.rune) {
      drawRune(this.ctx, px + margin, py + margin, size, cell.rune);
    }
  }

  /**
   * Draw grid lines overlay
   */
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

  /**
   * Get board offset for coordinate conversion (used by input)
   */
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
