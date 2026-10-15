import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadBatch, loadWord, sample, BATCH_SIZE } from '../js/words.js';

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

test('loadWord finds the full entry for a spelling', async () => {
  const entry = await loadWord('W7', { fetchFn: fakeFetch({ words: twenty }), cache: new Map() });
  assert.deepEqual(entry, { word: 'W7' });
});

test('loadWord gives null for a word the list does not have', async () => {
  assert.equal(await loadWord('Nope', { fetchFn: fakeFetch({ words: twenty }), cache: new Map() }), null);
});

test('loadWord fetches the list once and keeps it', async () => {
  let calls = 0;
  const fetchFn = async () => { calls += 1; return { ok: true, status: 200, json: async () => ({ words: twenty }) }; };
  const cache = new Map();
  await loadWord('W1', { fetchFn, cache });
  await loadWord('W2', { fetchFn, cache });
  assert.equal(calls, 1);
});

test('a failed loadWord fetch is tried again next time', async () => {
  const cache = new Map();
  await assert.rejects(() => loadWord('W1', { fetchFn: fakeFetch(null, { ok: false, status: 500 }), cache }));
  assert.deepEqual(await loadWord('W1', { fetchFn: fakeFetch({ words: twenty }), cache }), { word: 'W1' });
});
