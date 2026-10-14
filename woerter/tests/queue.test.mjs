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
