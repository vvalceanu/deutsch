/**
 * Serves words one at a time, refilling from a loader whenever it runs dry.
 *
 * The loader is whatever fetches a batch — a real endpoint or a stub. Keeping
 * the refill in here is what makes play endless without the UI knowing about
 * batches at all.
 *
 * With review storage and a loadWord, each next word is first given a source
 * by review.js: the bad list, the correct list or the big list. Review words
 * are stored as spellings, so their full entry comes from loadWord; one that
 * the word list no longer has is forgotten and a big-list word served instead.
 * Without them, every word comes from the big list.
 */

import { chooseSource, emptyReview, forget, pickReviewWord, recordAnswer } from './review.js';

export function createQueue(loadBatch, { reviewStorage = null, loadWord = null, rng = Math.random } = {}) {
  let buffer = [];
  let review = reviewStorage?.load() ?? emptyReview();

  function save() {
    reviewStorage?.save(review);
  }

  async function nextFromBatch() {
    if (buffer.length === 0) {
      buffer = [...(await loadBatch())];
      if (buffer.length === 0) throw new Error('The word loader returned no words.');
    }
    return buffer.shift();
  }

  async function nextFromReview() {
    if (!loadWord) return null;
    const source = chooseSource(review, rng);
    if (source === 'big') return null;

    const word = pickReviewWord(review, source, rng);
    const entry = await loadWord(word);
    if (!entry) {
      review = forget(review, word);
      save();
    }
    return entry;
  }

  return {
    async next() {
      return (await nextFromReview()) ?? nextFromBatch();
    },

    /** Called once per word, with whether the first pick was the right one. */
    answered(word, correct) {
      review = recordAnswer(review, word, correct);
      save();
    },
  };
}
