/**
 * Turns a word entry into a challenge: the correct spelling plus a handful of
 * its plausible misspellings, shuffled so the answer moves around.
 *
 * The random source is injected so that tests can pin the order down.
 */

export const DEFAULT_MAX_CHOICES = 4;

function shuffle(items, rng) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function buildChallenge(word, { maxChoices = DEFAULT_MAX_CHOICES, rng = Math.random } = {}) {
  const decoys = shuffle(word.wrong ?? [], rng).slice(0, Math.max(0, maxChoices - 1));

  return {
    word: word.word,
    ro: word.ro,
    def: word.def,
    choices: shuffle([word.word, ...decoys], rng),
  };
}
