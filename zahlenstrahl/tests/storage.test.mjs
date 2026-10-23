import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStorage, STORAGE_KEY } from '../js/storage.js';

function memoryBackend(initial = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
  };
}

const fresh = { score: { cherries: 0, pips: 0, lifetimePoints: 0 }, mode: 'A' };

test('nothing stored means a fresh score in mode A', () => {
  assert.deepEqual(createStorage(memoryBackend()).load(), fresh);
});

test('what is saved comes back', () => {
  const backend = memoryBackend();
  const saved = { score: { cherries: 4, pips: 7, lifetimePoints: 47 }, mode: 'C' };
  createStorage(backend).save(saved);
  assert.deepEqual(createStorage(backend).load(), saved);
});

test('garbage in storage starts fresh', () => {
  const backend = memoryBackend({ [STORAGE_KEY]: '{not json' });
  assert.deepEqual(createStorage(backend).load(), fresh);
});

test('bad fields are cleaned up one by one', () => {
  const backend = memoryBackend({
    [STORAGE_KEY]: JSON.stringify({ cherries: -3, pips: 2.7, lifetimePoints: 'x', mode: 'Q' }),
  });
  assert.deepEqual(createStorage(backend).load(), {
    score: { cherries: 0, pips: 2, lifetimePoints: 0 },
    mode: 'A',
  });
});

test('a mode that is only inherited, like "toString", is not accepted', () => {
  const backend = memoryBackend({ [STORAGE_KEY]: JSON.stringify({ mode: 'toString' }) });
  assert.equal(createStorage(backend).load().mode, 'A');
});

test('a throwing backend degrades to playing without memory', () => {
  const broken = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); },
  };
  const storage = createStorage(broken);
  assert.deepEqual(storage.load(), fresh);
  assert.doesNotThrow(() => storage.save(fresh));
});

test('no backend at all still works', () => {
  const storage = createStorage(null);
  assert.deepEqual(storage.load(), fresh);
  assert.doesNotThrow(() => storage.save(fresh));
});
