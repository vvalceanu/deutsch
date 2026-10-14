import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyScore, scoreCorrect, scoreWrong } from '../js/score.js';

/** Applies n correct answers in a row, returning the final result object. */
function runCorrect(n, score = emptyScore()) {
  let result = { score };
  for (let i = 0; i < n; i++) result = scoreCorrect(result.score);
  return result;
}

test('a fresh score has no points and no cherries', () => {
  assert.deepEqual(emptyScore(), { cherries: 0, pips: 0, lifetimePoints: 0 });
});

test('a correct answer adds one pip and one lifetime point', () => {
  const { score } = scoreCorrect(emptyScore());
  assert.equal(score.pips, 1);
  assert.equal(score.lifetimePoints, 1);
  assert.equal(score.cherries, 0);
});

test('a wrong answer leaves the score untouched', () => {
  const before = { cherries: 2, pips: 7, lifetimePoints: 27 };
  const { score } = scoreWrong(before);
  assert.deepEqual(score, before);
});

test('a wrong answer earns no celebration', () => {
  const { fireworks, cherryEarned } = scoreWrong({ cherries: 0, pips: 4, lifetimePoints: 4 });
  assert.equal(fireworks, false);
  assert.equal(cherryEarned, false);
});

test('every second point sets off fireworks', () => {
  for (const n of [2, 4, 6, 8, 10]) {
    assert.equal(runCorrect(n).fireworks, true, `point ${n} should celebrate`);
  }
});

test('odd points do not set off fireworks', () => {
  for (const n of [1, 3, 5, 7, 9]) {
    assert.equal(runCorrect(n).fireworks, false, `point ${n} should be quiet`);
  }
});

test('the tenth point turns ten pips into a cherry', () => {
  const { score, cherryEarned } = runCorrect(10);
  assert.equal(cherryEarned, true);
  assert.equal(score.cherries, 1);
  assert.equal(score.pips, 0);
  assert.equal(score.lifetimePoints, 10);
});

test('earning a cherry also sets off fireworks', () => {
  assert.equal(runCorrect(10).fireworks, true);
});

test('cherries accumulate without limit', () => {
  const { score } = runCorrect(35);
  assert.equal(score.cherries, 3);
  assert.equal(score.pips, 5);
});

test('scoring a correct answer does not mutate the score it was given', () => {
  const before = { cherries: 1, pips: 9, lifetimePoints: 19 };
  scoreCorrect(before);
  assert.deepEqual(before, { cherries: 1, pips: 9, lifetimePoints: 19 });
});
