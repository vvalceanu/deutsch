/**
 * Keeps the score and the chosen mode between visits.
 *
 * Storage can be unavailable — private windows, blocked site data — and a kid
 * losing their cherries is better than a kid facing a blank screen, so every
 * access is guarded and failure degrades to playing without a memory.
 */

import { DEFAULT_MODE, MODES } from './levels.js';
import { emptyScore, POINTS_PER_CHERRY } from './score.js';

export const STORAGE_KEY = 'zahlenstrahl.v1';

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
        if (!raw) return { score: emptyScore(), mode: DEFAULT_MODE };
        const stored = JSON.parse(raw);
        return {
          score: {
            cherries: count(stored.cherries),
            pips: count(stored.pips) % POINTS_PER_CHERRY,
            lifetimePoints: count(stored.lifetimePoints),
          },
          mode: Object.hasOwn(MODES, stored.mode) ? stored.mode : DEFAULT_MODE,
        };
      } catch {
        return { score: emptyScore(), mode: DEFAULT_MODE };
      }
    },

    save({ score, mode }) {
      try {
        backend?.setItem(key, JSON.stringify({ ...score, mode }));
      } catch {
        // Nothing to do — the game carries on in memory.
      }
    },
  };
}
