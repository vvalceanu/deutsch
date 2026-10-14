import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildChallenge } from '../js/challenge.js';

const STUHL = {
  word: 'Stuhl',
  ro: 'scaun',
  def: 'Möbel zum Sitzen mit Lehne',
  wrong: ['Shtul', 'Stul', 'Stül', 'Ștul'],
};

/** An rng that walks a fixed list of values, so shuffles are reproducible. */
function fixedRng(values) {
  let i = 0;
  return () => values[i++ % values.length];
}

test('a challenge offers four choices by default', () => {
  const challenge = buildChallenge(STUHL, { rng: fixedRng([0.5]) });
  assert.equal(challenge.choices.length, 4);
});

test('the correct spelling is always among the choices', () => {
  for (let seed = 0; seed < 20; seed++) {
    const challenge = buildChallenge(STUHL, { rng: fixedRng([seed / 20]) });
    assert.ok(challenge.choices.includes('Stuhl'), `seed ${seed} dropped the answer`);
  }
});

test('every other choice is one of the word\'s wrong forms', () => {
  const { choices } = buildChallenge(STUHL, { rng: fixedRng([0.1, 0.7, 0.3]) });
  for (const choice of choices.filter((c) => c !== 'Stuhl')) {
    assert.ok(STUHL.wrong.includes(choice), `${choice} is not a known wrong form`);
  }
});

test('no choice appears twice', () => {
  for (let seed = 0; seed < 20; seed++) {
    const { choices } = buildChallenge(STUHL, { rng: fixedRng([seed / 20, 0.33]) });
    assert.equal(new Set(choices).size, choices.length, `seed ${seed} produced a duplicate`);
  }
});

test('a word with only two wrong forms offers three choices', () => {
  const sparse = { word: 'Brot', ro: 'pâine', def: 'Essen aus Mehl', wrong: ['Brod', 'Prot'] };
  const { choices } = buildChallenge(sparse, { rng: fixedRng([0.5]) });
  assert.equal(choices.length, 3);
  assert.ok(choices.includes('Brot'));
});

test('maxChoices caps how many options are shown', () => {
  const { choices } = buildChallenge(STUHL, { maxChoices: 2, rng: fixedRng([0.5]) });
  assert.equal(choices.length, 2);
  assert.ok(choices.includes('Stuhl'));
});

test('the same rng always produces the same order', () => {
  const first = buildChallenge(STUHL, { rng: fixedRng([0.2, 0.8, 0.4]) });
  const second = buildChallenge(STUHL, { rng: fixedRng([0.2, 0.8, 0.4]) });
  assert.deepEqual(first.choices, second.choices);
});

test('the correct answer does not always sit in the same slot', () => {
  const low = buildChallenge(STUHL, { rng: fixedRng([0]) }).choices.indexOf('Stuhl');
  const high = buildChallenge(STUHL, { rng: fixedRng([0.999]) }).choices.indexOf('Stuhl');
  assert.notEqual(low, high);
});

test('a challenge carries the hints through unchanged', () => {
  const challenge = buildChallenge(STUHL, { rng: fixedRng([0.5]) });
  assert.equal(challenge.word, 'Stuhl');
  assert.equal(challenge.ro, 'scaun');
  assert.equal(challenge.def, 'Möbel zum Sitzen mit Lehne');
});
