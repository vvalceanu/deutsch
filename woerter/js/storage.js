/**
 * Keeps the score between visits.
 *
 * Storage can be unavailable — private windows, blocked site data — and a kid
 * losing their cherries is better than a kid facing a blank screen, so every
 * access is guarded and failure degrades to playing without a memory.
 */

import { emptyScore } from './score.js';

export const STORAGE_KEY = 'woerter.v1';

function count(value) {
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

/**
 * Reaching for localStorage can itself throw — Chrome raises a SecurityError on
 * the property access when site data is blocked — so even finding the backend
 * has to be guarded.
 */
function defaultBackend() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function createStorage(backend = defaultBackend(), key = STORAGE_KEY) {
  return {
    load() {
      try {
        const raw = backend?.getItem(key);
        if (!raw) return emptyScore();
        const stored = JSON.parse(raw);
        return {
          cherries: count(stored.cherries),
          pips: count(stored.pips),
          lifetimePoints: count(stored.lifetimePoints),
        };
      } catch {
        return emptyScore();
      }
    },

    save(score) {
      try {
        backend?.setItem(key, JSON.stringify(score));
      } catch {
        // Nothing to do — the game carries on in memory.
      }
    },
  };
}
