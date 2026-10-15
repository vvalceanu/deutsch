/**
 * The seam where the word list comes from.
 *
 * Today it is a static file holding every word, and the ten are picked here.
 * When the backend arrives its contract is "give me 10 random words", so the
 * swap is: point WORDS_URL at '/api/words?count=10' and drop the sample() call
 * below — the response shape is already identical. Nothing above this file
 * knows the difference.
 *
 * The review lists keep spellings only, so the second half of the contract is
 * "give me the details for word X": loadWord() below, which becomes
 * '/api/words/<word>' returning one entry, or a 404 for a word that is gone.
 */

export const WORDS_URL = 'words2.json';
export const BATCH_SIZE = 10;

export function sample(items, size) {
  const pool = [...items];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, size);
}

async function fetchAll(fetchFn, url) {
  const response = await fetchFn(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Could not load the word list (HTTP ${response.status}).`);

  const payload = await response.json();
  if (!Array.isArray(payload?.words)) throw new Error('The word list has no words in it.');
  return payload.words;
}

export async function loadBatch({ fetchFn = globalThis.fetch, url = WORDS_URL } = {}) {
  return sample(await fetchAll(fetchFn, url), BATCH_SIZE);
}

const fetched = new Map();

/**
 * The full entry for one spelling, or null when the list no longer has it.
 * The list is fetched once per page load and kept, so a review word costs no
 * request; a failed fetch is not kept, so the next call tries again.
 */
export async function loadWord(word, { fetchFn = globalThis.fetch, url = WORDS_URL, cache = fetched } = {}) {
  if (!cache.has(url)) {
    const pending = fetchAll(fetchFn, url);
    cache.set(url, pending);
    pending.catch(() => cache.delete(url));
  }
  const words = await cache.get(url);
  return words.find((entry) => entry.word === word) ?? null;
}
