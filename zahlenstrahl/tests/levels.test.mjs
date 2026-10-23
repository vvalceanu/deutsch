import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, MODES, ZONES, makeQuestion, markPairs, pickLevel, zoneOf } from '../js/levels.js';

/** A small seeded generator (mulberry32), so failures can be replayed. */
function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sample(levelId, count = 3000, seed = 1) {
  const rng = seeded(seed);
  const questions = [];
  let avoid = null;
  for (let i = 0; i < count; i++) {
    const q = makeQuestion(levelId, { rng, avoid });
    questions.push(q);
    avoid = q.n;
  }
  return questions;
}

const isRound = (m) => m % 10 === 0;

test('zoneOf places a number left, between or right of the marks', () => {
  assert.equal(zoneOf(3, 10, 20), 'left');
  assert.equal(zoneOf(15, 10, 20), 'middle');
  assert.equal(zoneOf(25, 10, 20), 'right');
});

for (const [id, level] of Object.entries(LEVELS)) {
  const levelId = Number(id);

  test(`level ${levelId}: every question obeys the level's rules`, () => {
    for (const q of sample(levelId)) {
      assert.ok(q.n >= 1 && q.n <= level.maxN, `n ${q.n} out of range`);
      assert.ok(q.left < q.right);
      const width = q.right - q.left;
      assert.ok(width >= level.minWidth && width <= level.maxWidth, `width ${width}`);
      assert.ok(q.left >= level.markMin && q.right <= level.markMax);
      assert.notEqual(q.n, q.left);
      assert.notEqual(q.n, q.right);
      assert.equal(q.zone, zoneOf(q.n, q.left, q.right));
      assert.equal(q.points, level.points);
      if (level.round) {
        assert.ok(isRound(q.left) && isRound(q.right), `${q.left}, ${q.right} not round`);
      } else {
        assert.ok(!isRound(q.left) && !isRound(q.right), `${q.left}, ${q.right} round`);
      }
      if (q.zone === 'left') assert.ok(q.left - q.n <= level.maxGap);
      if (q.zone === 'right') assert.ok(q.n - q.right <= level.maxGap);
    }
  });

  test(`level ${levelId}: each answer comes up about a third of the time`, () => {
    const questions = sample(levelId);
    for (const zone of ZONES) {
      const share = questions.filter((q) => q.zone === zone).length / questions.length;
      assert.ok(share > 0.28 && share < 0.39, `${zone}: ${share}`);
    }
  });

  test(`level ${levelId}: the same number never comes twice in a row`, () => {
    const questions = sample(levelId);
    for (let i = 1; i < questions.length; i++) {
      assert.notEqual(questions[i].n, questions[i - 1].n);
    }
  });

  test(`level ${levelId}: numbers and marks vary`, () => {
    const questions = sample(levelId);
    const numbers = new Set(questions.map((q) => q.n));
    const pairs = new Set(questions.map((q) => `${q.left}-${q.right}`));
    assert.ok(numbers.size > level.maxN * 0.9, `only ${numbers.size} numbers`);
    assert.ok(pairs.size >= 6, `only ${pairs.size} mark pairs`);
  });

  test(`level ${levelId}: every number has at least one possible answer`, () => {
    for (let n = 1; n <= level.maxN; n++) {
      const possible = ZONES.filter((zone) => markPairs(levelId, n, zone).length > 0);
      assert.ok(possible.length > 0, `n ${n} has no question`);
    }
  });
}

test('level 5 keeps the marks close together', () => {
  for (const q of sample(5)) assert.ok(q.right - q.left < 8);
});

test('mode A plays level 1 only, B levels 1-3, C all five', () => {
  const rng = seeded(7);
  const drawn = (mode) => new Set(Array.from({ length: 500 }, () => pickLevel(mode, rng)));
  assert.deepEqual([...drawn('A')].sort(), [1]);
  assert.deepEqual([...drawn('B')].sort(), [1, 2, 3]);
  assert.deepEqual([...drawn('C')].sort(), [1, 2, 3, 4, 5]);
  assert.deepEqual(MODES.C, [1, 2, 3, 4, 5]);
});

test('an unknown mode falls back to level 1', () => {
  assert.equal(pickLevel('Z', seeded(3)), 1);
});

test('harder levels are worth more points', () => {
  const points = Object.values(LEVELS).map((l) => l.points);
  for (let i = 1; i < points.length; i++) assert.ok(points[i] >= points[i - 1]);
  assert.ok(points.at(-1) > points[0]);
});
