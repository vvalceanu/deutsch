/**
 * The seam where the word list comes from.
 *
 * Today it is a static file holding every word, and the ten are picked here.
 * When the backend arrives its contract is "give me 10 random words", so the
 * swap is: point WORDS_URL at '/api/words?count=10' and drop the sample() call
 * below — the response shape is already identical. Nothing above this file
 * knows the difference.
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

export async function loadBatch({ fetchFn = globalThis.fetch, url = WORDS_URL } = {}) {
  const response = await fetchFn(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Could not load the word list (HTTP ${response.status}).`);

  const payload = await response.json();
  if (!Array.isArray(payload?.words)) throw new Error('The word list has no words in it.');

  return sample(payload.words, BATCH_SIZE);
}
