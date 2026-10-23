/**
 * Scoring rules, as pure functions over a plain object that is safe to persist.
 *
 * A correct answer is worth the question's points, one to four. Every ten points
 * become a cherry; what spills over the ten stays as points towards the next one.
 * Cherries are never spent and never capped. A wrong answer costs nothing.
 */

export const POINTS_PER_CHERRY = 10;

export function emptyScore() {
  return { cherries: 0, pips: 0, lifetimePoints: 0 };
}

export function scoreCorrect(score, points = 1) {
  const total = score.pips + points;
  const earned = Math.floor(total / POINTS_PER_CHERRY);

  return {
    score: {
      cherries: score.cherries + earned,
      pips: total % POINTS_PER_CHERRY,
      lifetimePoints: score.lifetimePoints + points,
    },
    cherryEarned: earned > 0,
  };
}
