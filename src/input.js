/**
 * Input handler for mouse/click events
 */

export class InputHandler {
  constructor(canvas, gameState, renderer, onUpdate) {
    this.canvas = canvas;
    this.gameState = gameState;
    this.renderer = renderer;
    this.onUpdate = onUpdate;

    this.boundHandleClick = this.handleClick.bind(this);
    this.boundHandleMouseMove = this.handleMouseMove.bind(this);

    this.setup();
  }

  setup() {
    this.canvas.addEventListener('click', this.boundHandleClick);
    this.canvas.addEventListener('mousemove', this.boundHandleMouseMove);
  }

  destroy() {
    this.canvas.removeEventListener('click', this.boundHandleClick);
    this.canvas.removeEventListener('mousemove', this.boundHandleMouseMove);
  }

  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const offset = this.renderer.getBoardOffset();
    const { x: gx, y: gy } = this.gameState.screenToGrid(x, y, offset.x, offset.y);

    if (gx >= 0 && gx < this.gameState.gridWidth && gy >= 0 && gy < this.gameState.gridHeight) {
      const placed = this.gameState.placeRune(gx, gy);
      if (placed) this.onUpdate?.();
    }
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const offset = this.renderer.getBoardOffset();
    const { x: gx, y: gy } = this.gameState.screenToGrid(x, y, offset.x, offset.y);

    if (gx >= 0 && gx < this.gameState.gridWidth && gy >= 0 && gy < this.gameState.gridHeight) {
      const canPlace = this.gameState.canPlaceAt(gx, gy);
      this.canvas.style.cursor = canPlace ? 'pointer' : 'default';
      this.gameState.selectedCell = canPlace ? { x: gx, y: gy } : null;
    } else {
      this.canvas.style.cursor = 'default';
      this.gameState.selectedCell = null;
    }
  }
}
