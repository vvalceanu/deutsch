import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createQueue } from '../js/queue.js';

/** A loader that hands out numbered batches and records how often it ran. */
function countingLoader(size = 3) {
  const state = { calls: 0 };
  const load = async () => {
    state.calls += 1;
    return Array.from({ length: size }, (_, i) => ({ word: `batch${state.calls}-${i}` }));
  };
  return { load, state };
}

test('the loader is not called until the first word is asked for', () => {
  const { load, state } = countingLoader();
  createQueue(load);
  assert.equal(state.calls, 0);
});

test('words are served in the order the loader provided them', async () => {
  const { load } = countingLoader();
  const queue = createQueue(load);
  assert.equal((await queue.next()).word, 'batch1-0');
  assert.equal((await queue.next()).word, 'batch1-1');
  assert.equal((await queue.next()).word, 'batch1-2');
});

test('one batch is fetched for as long as it lasts', async () => {
  const { load, state } = countingLoader();
  const queue = createQueue(load);
  await queue.next();
  await queue.next();
  await queue.next();
  assert.equal(state.calls, 1);
});

test('the next batch is fetched once the current one runs out', async () => {
  const { load, state } = countingLoader();
  const queue = createQueue(load);
  for (let i = 0; i < 4; i++) await queue.next();
  assert.equal(state.calls, 2);
});

test('play continues seamlessly across batches', async () => {
  const { load } = countingLoader();
  const queue = createQueue(load);
  const served = [];
  for (let i = 0; i < 5; i++) served.push((await queue.next()).word);
  assert.deepEqual(served, ['batch1-0', 'batch1-1', 'batch1-2', 'batch2-0', 'batch2-1']);
});

test('a loader that returns nothing fails loudly instead of hanging', async () => {
  const queue = createQueue(async () => []);
  await assert.rejects(() => queue.next(), /no words/i);
});

// --- review ---

/** Review storage held in a variable, so tests can see what was saved. */
function memoryReview(initial = { bad: {}, correct: [] }) {
  const state = { saved: initial };
  return { state, storage: { load: () => state.saved, save: (r) => { state.saved = r; } } };
}

const entries = { Stuhl: { word: 'Stuhl', ro: 'scaun' }, Hund: { word: 'Hund', ro: 'câine' } };
const lookup = async (word) => entries[word] ?? null;

test('a roll in the bad list serves that word in full', async () => {
  const { storage } = memoryReview({ bad: { Stuhl: 0 }, correct: [] });
  const queue = createQueue(countingLoader().load, { reviewStorage: storage, loadWord: lookup, rng: () => 0 });
  assert.deepEqual(await queue.next(), entries.Stuhl);
});

test('a roll in the big list serves from the batch', async () => {
  const { storage } = memoryReview({ bad: { Stuhl: 0 }, correct: [] });
  const queue = createQueue(countingLoader().load, { reviewStorage: storage, loadWord: lookup, rng: () => 0.99 });
  assert.equal((await queue.next()).word, 'batch1-0');
});

test('with nothing to review, the word list is never looked up', async () => {
  let lookups = 0;
  const queue = createQueue(countingLoader().load, {
    reviewStorage: memoryReview().storage,
    loadWord: async () => { lookups += 1; return null; },
    rng: () => 0,
  });
  await queue.next();
  assert.equal(lookups, 0);
});

test('answers are recorded and saved', () => {
  const { state, storage } = memoryReview();
  const queue = createQueue(countingLoader().load, { reviewStorage: storage, loadWord: lookup });
  queue.answered('Stuhl', false);
  queue.answered('Hund', true);
  assert.deepEqual(state.saved, { bad: { Stuhl: 0 }, correct: ['Hund'] });
});

test('a review word the list no longer has is forgotten and a batch word served', async () => {
  const { state, storage } = memoryReview({ bad: { Gone: 0 }, correct: [] });
  const queue = createQueue(countingLoader().load, { reviewStorage: storage, loadWord: lookup, rng: () => 0 });
  assert.equal((await queue.next()).word, 'batch1-0');
  assert.deepEqual(state.saved, { bad: {}, correct: [] });
});
