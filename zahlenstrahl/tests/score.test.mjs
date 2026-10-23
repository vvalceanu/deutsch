import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyScore, scoreCorrect } from '../js/score.js';

test('a fresh score has no points and no cherries', () => {
  assert.deepEqual(emptyScore(), { cherries: 0, pips: 0, lifetimePoints: 0 });
});

test('a correct answer adds its points', () => {
  const { score, cherryEarned } = scoreCorrect(emptyScore(), 3);
  assert.deepEqual(score, { cherries: 0, pips: 3, lifetimePoints: 3 });
  assert.equal(cherryEarned, false);
});

test('points default to one', () => {
  assert.equal(scoreCorrect(emptyScore()).score.pips, 1);
});

test('reaching ten points mints a cherry and empties the row', () => {
  const { score, cherryEarned } = scoreCorrect({ cherries: 2, pips: 9, lifetimePoints: 29 }, 1);
  assert.deepEqual(score, { cherries: 3, pips: 0, lifetimePoints: 30 });
  assert.equal(cherryEarned, true);
});

test('points past ten carry over to the next cherry', () => {
  const { score, cherryEarned } = scoreCorrect({ cherries: 0, pips: 8, lifetimePoints: 8 }, 4);
  assert.deepEqual(score, { cherries: 1, pips: 2, lifetimePoints: 12 });
  assert.equal(cherryEarned, true);
});

test('scoring does not change the score it was given', () => {
  const before = { cherries: 1, pips: 5, lifetimePoints: 15 };
  scoreCorrect(before, 2);
  assert.deepEqual(before, { cherries: 1, pips: 5, lifetimePoints: 15 });
});
