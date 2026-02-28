/**
 * Asset path resolver: try local first, fallback to racheloalden.com
 * Use for dynamically loaded assets (audio, images, etc.)
 */

/**
 * Base URL for fallback when assets aren't found locally.
 * If the game is in a subpath (e.g. /allthatglitters), include it:
 * 'https://racheloalden.com/allthatglitters'
 */
export const ASSET_FALLBACK_BASE = 'https://racheloalden.com';

/**
 * Get the local URL for an asset (relative to current page)
 * @param {string} path - Path like 'sounds/skull.mp3' or '/sounds/skull.mp3'
 * @returns {string} Full URL for local asset
 */
export function getLocalAssetUrl(path) {
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  return new URL(normalized, window.location.href).href;
}

/**
 * Get the fallback URL for an asset on racheloalden.com
 * @param {string} path - Path like 'sounds/skull.mp3'
 * @returns {string} Full URL for fallback
 */
export function getFallbackAssetUrl(path) {
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  const base = ASSET_FALLBACK_BASE.replace(/\/$/, '');
  return `${base}/${normalized}`;
}

/**
 * Play an audio file, trying local first and falling back to racheloalden.com on error
 * @param {string} path - Path like 'sounds/skull.mp3'
 */
export function playAudioWithFallback(path) {
  const audio = new Audio(getLocalAssetUrl(path));
  audio.play().catch(() => {});
  audio.addEventListener('error', () => {
    const fallback = new Audio(getFallbackAssetUrl(path));
    fallback.play().catch(() => {});
  }, { once: true });
}
