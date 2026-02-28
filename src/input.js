/**
 * Input handler for mouse/click events
 */

import { playPlaceSound, playRowColumnClearSound, playForgeSound, playSkullSound } from './audio.js';

export class InputHandler {
  constructor(canvas, gameState, renderer, onUpdate) {
    this.canvas = canvas;
    this.gameState = gameState;
    this.renderer = renderer;
    this.onUpdate = onUpdate;

    this.boundHandleClick = this.handleClick.bind(this);
    this.boundHandleContextMenu = this.handleContextMenu.bind(this);
    this.boundHandleMouseMove = this.handleMouseMove.bind(this);

    this.setup();
  }

  setup() {
    this.canvas.addEventListener('click', this.boundHandleClick);
    this.canvas.addEventListener('contextmenu', this.boundHandleContextMenu);
    this.canvas.addEventListener('mousemove', this.boundHandleMouseMove);
  }

  destroy() {
    this.canvas.removeEventListener('click', this.boundHandleClick);
    this.canvas.removeEventListener('contextmenu', this.boundHandleContextMenu);
    this.canvas.removeEventListener('mousemove', this.boundHandleMouseMove);
  }

  handleContextMenu(e) {
    e.preventDefault();
    // Right-click anywhere on board = discard (spec)
    if (this.gameState.currentRune && this.gameState.discardToForge()) {
      playForgeSound();
      this.onUpdate?.();
    }
  }

  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const offset = this.renderer.getBoardOffset();
    const { x: gx, y: gy } = this.gameState.screenToGrid(x, y, offset.x, offset.y);

    if (gx < 0 || gx >= this.gameState.gridWidth || gy < 0 || gy >= this.gameState.gridHeight) {
      return;
    }

    // Skull: click on rune to remove it
    if (this.gameState.currentRune?.isSkull) {
      const removed = this.gameState.useSkullToRemove(gx, gy);
      if (removed) {
        playSkullSound();
        this.onUpdate?.();
      }
      return;
    }

    // Normal placement
    const result = this.gameState.placeRune(gx, gy);
    if (result.placed) {
      this.renderer.addScorePopup(gx, gy, result.totalPoints);
      if (result.rowColumnCleared) {
        playRowColumnClearSound();
      } else {
        playPlaceSound();
      }
      this.onUpdate?.();
    }
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const offset = this.renderer.getBoardOffset();
    const { x: gx, y: gy } = this.gameState.screenToGrid(x, y, offset.x, offset.y);

    if (gx >= 0 && gx < this.gameState.gridWidth && gy >= 0 && gy < this.gameState.gridHeight) {
      if (this.gameState.currentRune?.isSkull) {
        const canRemove = this.gameState.canSkullRemoveAt(gx, gy);
        this.canvas.style.cursor = canRemove ? 'pointer' : 'default';
        this.gameState.selectedCell = canRemove ? { x: gx, y: gy } : null;
      } else {
        const canPlace = this.gameState.canPlaceAt(gx, gy);
        this.canvas.style.cursor = canPlace ? 'pointer' : 'default';
        this.gameState.selectedCell = canPlace ? { x: gx, y: gy } : null;
      }
    } else {
      this.canvas.style.cursor = 'default';
      this.gameState.selectedCell = null;
    }
  }
}
