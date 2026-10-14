import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadBatch, sample, BATCH_SIZE } from '../js/words.js';

const twenty = Array.from({ length: 20 }, (_, i) => ({ word: `W${i}` }));

/** Stands in for fetch, returning a canned payload. */
function fakeFetch(payload, { ok = true, status = 200 } = {}) {
  return async () => ({ ok, status, json: async () => payload });
}

test('a batch is ten words', async () => {
  const batch = await loadBatch({ fetchFn: fakeFetch({ words: twenty }) });
  assert.equal(batch.length, BATCH_SIZE);
});

test('a batch holds no repeats', async () => {
  const batch = await loadBatch({ fetchFn: fakeFetch({ words: twenty }) });
  assert.equal(new Set(batch.map((w) => w.word)).size, BATCH_SIZE);
});

test('every word in a batch came from the list', async () => {
  const batch = await loadBatch({ fetchFn: fakeFetch({ words: twenty }) });
  const known = new Set(twenty.map((w) => w.word));
  for (const w of batch) assert.ok(known.has(w.word), `${w.word} was invented`);
});

test('a list shorter than a batch is served whole', async () => {
  const three = twenty.slice(0, 3);
  const batch = await loadBatch({ fetchFn: fakeFetch({ words: three }) });
  assert.equal(batch.length, 3);
});

test('a backend that already returns ten words is passed straight through', async () => {
  const ten = twenty.slice(0, BATCH_SIZE);
  const batch = await loadBatch({ fetchFn: fakeFetch({ words: ten }) });
  assert.equal(batch.length, BATCH_SIZE);
  assert.deepEqual(new Set(batch.map((w) => w.word)), new Set(ten.map((w) => w.word)));
});

test('a failed request explains itself', async () => {
  const fetchFn = fakeFetch({}, { ok: false, status: 404 });
  await assert.rejects(() => loadBatch({ fetchFn }), /404/);
});

test('a payload with no words list fails loudly', async () => {
  await assert.rejects(() => loadBatch({ fetchFn: fakeFetch({}) }), /words/i);
});

test('sampling draws a different order over repeated calls', () => {
  const orders = new Set();
  for (let i = 0; i < 25; i++) orders.add(sample(twenty, 5).map((w) => w.word).join());
  assert.ok(orders.size > 1, 'sampling looks deterministic');
});
