/**
 * Keeps the score between visits.
 *
 * Storage can be unavailable — private windows, blocked site data — and a kid
 * losing their cherries is better than a kid facing a blank screen, so every
 * access is guarded and failure degrades to playing without a memory.
 */

import { emptyReview } from './review.js';
import { emptyScore } from './score.js';

export const STORAGE_KEY = 'woerter.v1';
export const REVIEW_KEY = 'woerter.review.v1';

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

function isWord(value) {
  return typeof value === 'string' && value.length > 0;
}

/**
 * The review lists, under a key of their own so that saving the score can never
 * overwrite them. Same guarding as the score: anything unreadable is dropped
 * and the lists start empty rather than the game failing to start.
 */
export function createReviewStorage(backend = defaultBackend(), key = REVIEW_KEY) {
  return {
    load() {
      try {
        const raw = backend?.getItem(key);
        if (!raw) return emptyReview();
        const stored = JSON.parse(raw);

        const bad = {};
        if (stored.bad && typeof stored.bad === 'object' && !Array.isArray(stored.bad)) {
          for (const [word, streak] of Object.entries(stored.bad)) {
            if (isWord(word)) bad[word] = count(streak);
          }
        }
        const correct = Array.isArray(stored.correct)
          ? [...new Set(stored.correct.filter((w) => isWord(w) && !Object.hasOwn(bad, w)))]
          : [];

        return { bad, correct };
      } catch {
        return emptyReview();
      }
    },

    save(review) {
      try {
        backend?.setItem(key, JSON.stringify(review));
      } catch {
        // Nothing to do — the game carries on in memory.
      }
    },
  };
}
