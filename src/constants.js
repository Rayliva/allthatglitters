/**
 * Game constants: zodiac symbols, colors, rankings, scoring
 */

// Zodiac symbols (astrological glyphs) - Unicode U+2648 to U+2653
export const ZODIAC_SYMBOLS = [
  'aries',      // ♈
  'taurus',     // ♉
  'gemini',     // ♊
  'cancer',     // ♋
  'leo',        // ♌
  'virgo',      // ♍
  'libra',      // ♎
  'scorpio',    // ♏
  'sagittarius',// ♐
  'capricorn',  // ♑
  'aquarius',   // ♒
  'pisces',     // ♓
];

export const ZODIAC_UNICODE = {
  aries: '\u2648',
  taurus: '\u2649',
  gemini: '\u264A',
  cancer: '\u264B',
  leo: '\u264C',
  virgo: '\u264D',
  libra: '\u264E',
  scorpio: '\u264F',
  sagittarius: '\u2650',
  capricorn: '\u2651',
  aquarius: '\u2652',
  pisces: '\u2653',
};

// Rune colors - expand as levels increase
export const RUNE_COLORS = [
  'crimson',   // #dc2626
  'azure',     // #2563eb
  'amber',     // #d97706
  'emerald',   // #059669
  'violet',    // #7c3aed
  'coral',     // #ea580c
  'teal',      // #0d9488
  'rose',      // #e11d48
];

// How many symbols/colors available at each board (1-indexed)
// Board 1-3: 5 symbols, 4 colors
// Board 4-6: 8 symbols, 5 colors
// Board 7+: all 12 symbols, all 8 colors
export function getSymbolCountForBoard(board) {
  if (board <= 3) return 5;
  if (board <= 6) return 8;
  return 12;
}

export function getColorCountForBoard(board) {
  if (board <= 3) return 4;
  if (board <= 6) return 5;
  return 8;
}

// Skill levels: starting board (legacy, used for createGameState)
export const SKILL_LEVELS = {
  1: { startBoard: 1, label: 'Apprentice' },
  2: { startBoard: 4, label: 'Adept' },
  3: { startBoard: 7, label: 'Master' },
};

// Game modes
export const GAME_MODES = {
  strategic: 'strategic',
  time: 'time',
};

// Difficulty levels: startBoard and time limit per board (seconds, time mode only)
export const DIFFICULTY_LEVELS = {
  easy: { startBoard: 1, timePerBoard: 90, label: 'Easy' },
  medium: { startBoard: 4, timePerBoard: 60, label: 'Medium' },
  difficult: { startBoard: 7, timePerBoard: 45, label: 'Difficult' },
};

// Rankings from spec (score range -> title)
export const RANKINGS = [
  [0, 399, 'Cursed'],
  [400, 699, 'Bungler'],
  [700, 999, 'Dabbler'],
  [1000, 1499, 'Junior Apprentice'],
  [1500, 1999, 'Apprentice'],
  [2000, 2499, 'Senior Apprentice'],
  [2500, 2999, 'Prestidigitator'],
  [3000, 3499, 'Hedge wizard'],
  [3500, 4499, 'Concoctionist'],
  [4500, 4999, 'Thaumaturge'],
  [5000, 5999, 'Transmuter'],
  [6000, 6999, 'Wizard 3rd class'],
  [7000, 7999, 'Wizard 2nd class'],
  [8000, 9999, 'Wizard 1st class'],
  [10000, 11999, 'Grand Wizard'],
  [12000, 13999, 'Alchemist 3rd class'],
  [14000, 15999, 'Alchemist 2nd class'],
  [16000, 19999, 'Alchemist 1st class'],
  [20000, 24999, 'Master Alchemist'],
  [25000, 29999, 'Grand Alchemist'],
  [30000, 39999, 'Supreme Alchemist'],
  [40000, Infinity, 'Grand Alchemical Emperor'],
];

export function getRanking(score) {
  for (const [min, max, title] of RANKINGS) {
    if (score >= min && score <= max) return { title, nextAt: max === Infinity ? null : max + 1 };
  }
  return { title: 'Cursed', nextAt: 400 };
}

// Scoring: gold vs lead placement, row clear, board clear
// Placing on already-gold cell = 1 pt; placing on lead cell = 5 pts (and turns it gold)
export function getPlacementPoints(cell) {
  return cell?.state === 'gold' ? 1 : 5;
}

export function getRowClearPoints() {
  return 55;
}

export function getBoardClearPoints(board) {
  return 50 + (board - 1) * 10; // 50, 60, 70...
}

// Special rune chances (0-1)
export const WILD_CHANCE = 0.03;
export const SKULL_CHANCE = 0.02;
