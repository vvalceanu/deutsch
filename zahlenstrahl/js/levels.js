/**
 * Questions: one number, two marks on a line, and where the number belongs —
 * left of the marks, between them, or right of them. Pure; pass an `rng` to
 * make it repeatable.
 *
 * The answer is drawn first, a third of the time each, so no side of the line
 * is a safe guess. Then a number for which that answer is possible, then a pair
 * of marks among every pair the level allows for that number and answer.
 */

/**
 * - `maxN`         numbers run from 1 to maxN
 * - `round`        marks are multiples of ten; otherwise never are
 * - `markMin/Max`  where marks may sit
 * - `minWidth/maxWidth`  distance between the two marks
 * - `maxGap`       a number outside the marks is at most this far from the nearer
 *                  one, so "left" never means "obviously miles away"
 * - `points`       harder questions are worth more
 */
export const LEVELS = {
  1: { maxN: 50, round: true, markMin: 0, markMax: 60, minWidth: 10, maxWidth: 30, maxGap: 15, points: 1 },
  2: { maxN: 30, round: false, markMin: 1, markMax: 39, minWidth: 10, maxWidth: 30, maxGap: 10, points: 2 },
  3: { maxN: 99, round: true, markMin: 0, markMax: 100, minWidth: 10, maxWidth: 30, maxGap: 15, points: 2 },
  4: { maxN: 99, round: false, markMin: 1, markMax: 99, minWidth: 10, maxWidth: 30, maxGap: 15, points: 3 },
  5: { maxN: 99, round: false, markMin: 1, markMax: 99, minWidth: 2, maxWidth: 7, maxGap: 6, points: 4 },
};

/** The switch in the corner: which levels a game draws from. */
export const MODES = {
  A: [1],
  B: [1, 2, 3],
  C: [1, 2, 3, 4, 5],
};
export const DEFAULT_MODE = 'A';

export const ZONES = ['left', 'middle', 'right'];

export function zoneOf(n, left, right) {
  if (n < left) return 'left';
  if (n > right) return 'right';
  return 'middle';
}

function randomInt(min, max, rng) {
  return min + Math.floor(rng() * (max - min + 1));
}

function pick(items, rng) {
  return items[Math.floor(rng() * items.length)];
}

function marksFor(level) {
  const marks = [];
  for (let m = level.markMin; m <= level.markMax; m++) {
    if ((m % 10 === 0) === level.round) marks.push(m);
  }
  return marks;
}

/** Every [left, right] pair the level allows that puts `n` in `zone`. */
export function markPairs(levelId, n, zone) {
  const level = LEVELS[levelId];
  const marks = marksFor(level);
  const pairs = [];

  for (const left of marks) {
    for (const right of marks) {
      const width = right - left;
      if (width < level.minWidth || width > level.maxWidth) continue;
      if (n === left || n === right) continue;
      if (zoneOf(n, left, right) !== zone) continue;
      if (zone === 'left' && left - n > level.maxGap) continue;
      if (zone === 'right' && n - right > level.maxGap) continue;
      pairs.push([left, right]);
    }
  }
  return pairs;
}

export function pickLevel(mode, rng = Math.random) {
  return pick(MODES[mode] ?? MODES[DEFAULT_MODE], rng);
}

/**
 * One question of the given level. `avoid` is the previous number, so the same
 * one never shows up twice in a row.
 */
export function makeQuestion(levelId, { rng = Math.random, avoid = null } = {}) {
  const level = LEVELS[levelId];
  // Drawn once, outside the loop: re-drawing it on a miss would favour the
  // answers that fit more numbers.
  const zone = pick(ZONES, rng);

  for (let attempt = 0; attempt < 500; attempt++) {
    const n = randomInt(1, level.maxN, rng);
    if (n === avoid) continue;

    const pairs = markPairs(levelId, n, zone);
    if (pairs.length === 0) continue;

    const [left, right] = pick(pairs, rng);
    return { level: levelId, n, left, right, zone, points: level.points };
  }

  throw new Error(`no question found for level ${levelId}`);
}
