/**
 * High score leaderboard using localStorage
 */

const STORAGE_KEY = 'allthatglitters_highscores';
const MAX_ENTRIES = 10;

/**
 * Load high scores from localStorage
 */
export function loadHighScores() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Save a score to the leaderboard. Returns true if it made the list.
 */
export function saveScore(score) {
  const scores = loadHighScores();
  const entry = { score, date: new Date().toISOString() };
  scores.push(entry);
  scores.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const top = scores.slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(top));
    return top.some((e) => e.score === score && e.date === entry.date);
  } catch {
    return false;
  }
}
