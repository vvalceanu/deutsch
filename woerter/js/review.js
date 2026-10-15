/**
 * Repetitio mater studiorum: which words come back, and when they stop.
 *
 * Two lists, holding spellings only. A word missed goes onto the bad list and
 * stays until it is answered correctly twice since its last miss. A word
 * answered correctly goes onto the correct list and comes back once. Each next
 * word is drawn from the bad list, the correct list or the big list, with the
 * weights below; a list with nothing on it hands its share to the others.
 *
 * Pure functions over a plain object that is safe to persist, like score.js.
 */

export const SOURCE_WEIGHTS = { bad: 0.3, correct: 0.2, big: 0.5 };
export const CORRECT_TO_CLEAR = 2;

export function emptyReview() {
  return { bad: {}, correct: [] };
}

function sizeOf(review, source) {
  if (source === 'bad') return Object.keys(review.bad).length;
  if (source === 'correct') return review.correct.length;
  return Infinity; // the big list never runs out
}

/** Picks 'bad', 'correct' or 'big', sharing out the weight of empty lists. */
export function chooseSource(review, rng = Math.random) {
  const available = Object.entries(SOURCE_WEIGHTS).filter(([source]) => sizeOf(review, source) > 0);
  const total = available.reduce((sum, [, weight]) => sum + weight, 0);

  let roll = rng() * total;
  for (const [source, weight] of available) {
    roll -= weight;
    if (roll < 0) return source;
  }
  return available[available.length - 1][0];
}

/** One spelling from the bad or correct list, or null when it is empty. */
export function pickReviewWord(review, source, rng = Math.random) {
  const words = source === 'bad' ? Object.keys(review.bad) : review.correct;
  if (words.length === 0) return null;
  return words[Math.floor(rng() * words.length)];
}

/**
 * The rules go by which list the word is on, not where it was drawn from, so a
 * word drawn from the big list that is already under review is treated as one.
 */
export function recordAnswer(review, word, correct) {
  const bad = { ...review.bad };
  let list = review.correct.filter((w) => w !== word);
  const wasCorrect = list.length !== review.correct.length;

  if (Object.hasOwn(bad, word)) {
    if (!correct) bad[word] = 0;
    else if (bad[word] + 1 >= CORRECT_TO_CLEAR) delete bad[word];
    else bad[word] += 1;
  } else if (!correct) {
    bad[word] = 0;
  } else if (!wasCorrect) {
    list = [...list, word];
  }

  return { bad, correct: list };
}

/** Takes a word off both lists, for words the word list no longer has. */
export function forget(review, word) {
  const bad = { ...review.bad };
  delete bad[word];
  return { bad, correct: review.correct.filter((w) => w !== word) };
}
