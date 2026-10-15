import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  chooseSource, emptyReview, forget, pickReviewWord, recordAnswer,
} from '../js/review.js';

/** An rng that always returns the same value. */
const fixed = (value) => () => value;

const withBoth = { bad: { Stuhl: 0 }, correct: ['Hund'] };
const onlyBad = { bad: { Stuhl: 0 }, correct: [] };
const onlyCorrect = { bad: {}, correct: ['Hund'] };

// --- choosing the source ---

test('with both lists filled, the first 30% of the roll is the bad list', () => {
  assert.equal(chooseSource(withBoth, fixed(0)), 'bad');
  assert.equal(chooseSource(withBoth, fixed(0.29)), 'bad');
});

test('with both lists filled, the next 20% is the correct list', () => {
  assert.equal(chooseSource(withBoth, fixed(0.31)), 'correct');
  assert.equal(chooseSource(withBoth, fixed(0.49)), 'correct');
});

test('with both lists filled, the last 50% is the big list', () => {
  assert.equal(chooseSource(withBoth, fixed(0.51)), 'big');
  assert.equal(chooseSource(withBoth, fixed(0.999)), 'big');
});

test('with nothing to review, every word comes from the big list', () => {
  assert.equal(chooseSource(emptyReview(), fixed(0)), 'big');
  assert.equal(chooseSource(emptyReview(), fixed(0.999)), 'big');
});

test('an empty correct list shares its weight: bad gets 3/8, big 5/8', () => {
  assert.equal(chooseSource(onlyBad, fixed(0.37)), 'bad');
  assert.equal(chooseSource(onlyBad, fixed(0.38)), 'big');
});

test('an empty bad list shares its weight: correct gets 2/7, big 5/7', () => {
  assert.equal(chooseSource(onlyCorrect, fixed(0.28)), 'correct');
  assert.equal(chooseSource(onlyCorrect, fixed(0.29)), 'big');
});

test('over many draws the weights come out near 30/20/50', () => {
  let seed = 1;
  const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const tally = { bad: 0, correct: 0, big: 0 };
  for (let i = 0; i < 20000; i++) tally[chooseSource(withBoth, rng)] += 1;
  assert.ok(Math.abs(tally.bad / 20000 - 0.3) < 0.02, `bad ${tally.bad}`);
  assert.ok(Math.abs(tally.correct / 20000 - 0.2) < 0.02, `correct ${tally.correct}`);
  assert.ok(Math.abs(tally.big / 20000 - 0.5) < 0.02, `big ${tally.big}`);
});

// --- picking a word ---

test('a review word is picked from the chosen list', () => {
  const review = { bad: { Stuhl: 0, Tisch: 1 }, correct: ['Hund', 'Katze'] };
  assert.equal(pickReviewWord(review, 'bad', fixed(0)), 'Stuhl');
  assert.equal(pickReviewWord(review, 'bad', fixed(0.99)), 'Tisch');
  assert.equal(pickReviewWord(review, 'correct', fixed(0.99)), 'Katze');
});

test('an empty list gives no word', () => {
  assert.equal(pickReviewWord(emptyReview(), 'bad', fixed(0)), null);
});

// --- recording answers: a word on neither list ---

test('a new word answered correctly goes onto the correct list', () => {
  assert.deepEqual(recordAnswer(emptyReview(), 'Hund', true), { bad: {}, correct: ['Hund'] });
});

test('a new word missed goes onto the bad list at zero', () => {
  assert.deepEqual(recordAnswer(emptyReview(), 'Stuhl', false), { bad: { Stuhl: 0 }, correct: [] });
});

// --- the correct list ---

test('a correct-list word answered correctly is dropped', () => {
  assert.deepEqual(recordAnswer(onlyCorrect, 'Hund', true), emptyReview());
});

test('a correct-list word missed moves to the bad list at zero', () => {
  assert.deepEqual(recordAnswer(onlyCorrect, 'Hund', false), { bad: { Hund: 0 }, correct: [] });
});

// --- the bad list ---

test('a bad-list word answered correctly once stays, counting one', () => {
  assert.deepEqual(recordAnswer(onlyBad, 'Stuhl', true), { bad: { Stuhl: 1 }, correct: [] });
});

test('a bad-list word answered correctly twice is dropped, not moved', () => {
  const once = recordAnswer(onlyBad, 'Stuhl', true);
  assert.deepEqual(recordAnswer(once, 'Stuhl', true), emptyReview());
});

test('a miss on the bad list sets the count back to zero', () => {
  const once = recordAnswer(onlyBad, 'Stuhl', true);
  const missed = recordAnswer(once, 'Stuhl', false);
  assert.deepEqual(missed, onlyBad);
  assert.deepEqual(recordAnswer(missed, 'Stuhl', true), { bad: { Stuhl: 1 }, correct: [] });
});

// --- bookkeeping ---

test('recording an answer leaves the old state untouched', () => {
  const before = { bad: { Stuhl: 0 }, correct: ['Hund'] };
  recordAnswer(before, 'Stuhl', true);
  recordAnswer(before, 'Hund', false);
  assert.deepEqual(before, { bad: { Stuhl: 0 }, correct: ['Hund'] });
});

test('other words on the lists are not disturbed', () => {
  const after = recordAnswer(withBoth, 'Tisch', false);
  assert.deepEqual(after, { bad: { Stuhl: 0, Tisch: 0 }, correct: ['Hund'] });
});

test('a word named like an object property is still a plain word', () => {
  assert.deepEqual(recordAnswer(emptyReview(), 'constructor', true), { bad: {}, correct: ['constructor'] });
});

test('forget takes a word off both lists', () => {
  assert.deepEqual(forget(withBoth, 'Stuhl'), onlyCorrect);
  assert.deepEqual(forget(withBoth, 'Hund'), onlyBad);
});
