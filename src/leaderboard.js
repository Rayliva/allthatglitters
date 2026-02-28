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
 * Save a score to the leaderboard. Returns { madeList, date } - date is the new entry's timestamp for later name updates.
 */
export function saveScore(score, name = '') {
  const scores = loadHighScores();
  const entry = { score, date: new Date().toISOString(), name: (name || '').trim() };
  scores.push(entry);
  scores.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const top = scores.slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(top));
    const madeList = top.some((e) => e.score === score && e.date === entry.date);
    return { madeList, date: entry.date };
  } catch {
    return { madeList: false, date: null };
  }
}

/**
 * Update the name for an existing leaderboard entry (by score and date).
 */
export function updateEntryName(score, date, name) {
  const scores = loadHighScores();
  const entry = scores.find((e) => e.score === score && e.date === date);
  if (!entry) return false;
  entry.name = (name || '').trim();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
    return true;
  } catch {
    return false;
  }
}
