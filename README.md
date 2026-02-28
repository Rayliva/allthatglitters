# All That Glitters

A browser-based clone of the classic Alchemy puzzle game, built with Vite and Vanilla JavaScript.

## Setup

```bash
npm install
npm run dev
```

Then open http://localhost:5173 in your browser.

## How to Play

- **Place Runes**: Click on an empty cell to place your current rune. You can only place a rune if it shares a property (color or symbol) with an adjacent cell. The first placement can go anywhere.
- **Discard**: Use "Discard to Forge" when you can't place your current rune. Discarded runes fill the Forge.
- **Clear the Forge**: Each successful placement removes one rune from the Forge.
- **Score**: Earn points for placements, converting Lead to Gold, and clearing full rows/columns.

## Project Structure

- `main.js` - Entry point, animation loop
- `game.js` - Game state, grid logic, rules engine
- `renderer.js` - Canvas drawing
- `input.js` - Mouse/click handling
