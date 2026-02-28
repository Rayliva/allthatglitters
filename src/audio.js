/**
 * Procedural sound effects using Web Audio API
 * No external audio files required
 */

import { playAudioWithFallback } from './assets.js';

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

/** Resume context on first user interaction (browser autoplay policy) */
function ensureResumed() {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
}

/**
 * Play a tone with envelope
 * @param {number} freq - Frequency in Hz
 * @param {number} duration - Duration in seconds
 * @param {string} type - Oscillator type: 'sine' | 'square' | 'triangle' | 'sawtooth'
 * @param {number} gain - Volume 0-1
 * @param {number} attack - Attack time in seconds
 * @param {number} decay - Decay time in seconds
 */
function playTone(freq, duration, type = 'sine', gain = 0.2, attack = 0.01, decay = 0.1) {
  ensureResumed();
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(gain, now + attack);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + attack + decay);

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + Math.min(duration, attack + decay + 0.05));
}

/** Short satisfying pop for rune placement */
export function playPlaceSound() {
  playTone(440, 0.08, 'sine', 0.15, 0.005, 0.06);
}

/** Bright bling for row/column clear */
export function playRowColumnClearSound() {
  ensureResumed();
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5 - major chord
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.12, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2 + i * 0.02);
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start(now + i * 0.02);
    osc.stop(now + 0.25);
  });
}

/** Skull removing a rune - uses custom audio file */
export function playSkullSound() {
  playAudioWithFallback('sounds/skull.mp3');
}

/** Metallic clink for contributing to the forge */
export function playForgeSound() {
  ensureResumed();
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 800;

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(880, now);
  osc.frequency.exponentialRampToValueAtTime(440, now + 0.12);
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(0.2, now + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

  osc.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.15);
}

/** Sad descending tone for game over */
export function playLoseSound() {
  ensureResumed();
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  const freqs = [392, 349.23, 293.66, 261.63]; // G4, F4, D4, C4 - descending
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.15, now + 0.05 + i * 0.08);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15 + i * 0.08);
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start(now + i * 0.12);
    osc.stop(now + 0.6);
  });
}

/** Triumphant fanfare for level complete */
export function playWinSound() {
  ensureResumed();
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  const notes = [
    { freq: 523.25, start: 0, dur: 0.15 },   // C5
    { freq: 659.25, start: 0.1, dur: 0.15 }, // E5
    { freq: 783.99, start: 0.2, dur: 0.15 }, // G5
    { freq: 1046.5, start: 0.3, dur: 0.25 }, // C6 - held
  ];
  notes.forEach(({ freq, start, dur }) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + start);
    gainNode.gain.setValueAtTime(0, now + start);
    gainNode.gain.linearRampToValueAtTime(0.2, now + start + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start(now + start);
    osc.stop(now + start + dur + 0.02);
  });
}
