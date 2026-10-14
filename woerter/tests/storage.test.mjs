import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStorage } from '../js/storage.js';
import { emptyScore } from '../js/score.js';

/** A stand-in for localStorage, backed by a Map. */
function fakeBackend(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
  };
}

/** Private browsing: every access throws. */
const hostileBackend = {
  getItem() { throw new DOMException('denied'); },
  setItem() { throw new DOMException('denied'); },
};

test('a first-time player starts from an empty score', () => {
  const storage = createStorage(fakeBackend(), 'woerter.test');
  assert.deepEqual(storage.load(), emptyScore());
});

test('a saved score comes back on the next visit', () => {
  const backend = fakeBackend();
  const storage = createStorage(backend, 'woerter.test');
  storage.save({ cherries: 4, pips: 6, lifetimePoints: 46 });
  assert.deepEqual(createStorage(backend, 'woerter.test').load(), {
    cherries: 4, pips: 6, lifetimePoints: 46,
  });
});

test('unreadable stored data falls back to an empty score', () => {
  const storage = createStorage(fakeBackend({ 'woerter.test': '{not json' }), 'woerter.test');
  assert.deepEqual(storage.load(), emptyScore());
});

test('stored numbers that are not numbers fall back to zero', () => {
  const stored = JSON.stringify({ cherries: 'lots', pips: null, lifetimePoints: 12 });
  const storage = createStorage(fakeBackend({ 'woerter.test': stored }), 'woerter.test');
  assert.deepEqual(storage.load(), { cherries: 0, pips: 0, lifetimePoints: 12 });
});

test('a missing field falls back to zero rather than undefined', () => {
  const storage = createStorage(fakeBackend({ 'woerter.test': '{"cherries":2}' }), 'woerter.test');
  assert.deepEqual(storage.load(), { cherries: 2, pips: 0, lifetimePoints: 0 });
});

test('blocked storage still lets the game start', () => {
  const storage = createStorage(hostileBackend, 'woerter.test');
  assert.deepEqual(storage.load(), emptyScore());
});

test('blocked storage does not break scoring', () => {
  const storage = createStorage(hostileBackend, 'woerter.test');
  assert.doesNotThrow(() => storage.save({ cherries: 1, pips: 1, lifetimePoints: 11 }));
});

test('a missing storage backend is tolerated', () => {
  const storage = createStorage(null, 'woerter.test');
  assert.deepEqual(storage.load(), emptyScore());
  assert.doesNotThrow(() => storage.save(emptyScore()));
});

// Chrome throws on the *property access* itself when site data is blocked, so
// reaching for the default backend must not take the game down with it.
test('a localStorage that throws on access does not stop the game starting', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() { throw new Error('access denied'); },
  });

  try {
    let storage;
    assert.doesNotThrow(() => { storage = createStorage(undefined, 'woerter.test'); });
    assert.deepEqual(storage.load(), emptyScore());
    assert.doesNotThrow(() => storage.save({ cherries: 1, pips: 2, lifetimePoints: 12 }));
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else delete globalThis.localStorage;
  }
});
