/**
 * Scoring rules, as pure functions over a plain object that is safe to persist.
 *
 * A correct answer is worth one point. Ten points become a cherry; cherries are
 * never spent and never capped. Every second point sets off fireworks, so the
 * cherry milestone celebrates twice over.
 */

export const POINTS_PER_CHERRY = 10;
export const FIREWORKS_EVERY = 2;

export function emptyScore() {
  return { cherries: 0, pips: 0, lifetimePoints: 0 };
}

export function scoreCorrect(score) {
  const lifetimePoints = score.lifetimePoints + 1;
  let pips = score.pips + 1;
  let cherries = score.cherries;

  const cherryEarned = pips >= POINTS_PER_CHERRY;
  if (cherryEarned) {
    pips = 0;
    cherries += 1;
  }

  return {
    score: { cherries, pips, lifetimePoints },
    fireworks: lifetimePoints % FIREWORKS_EVERY === 0,
    cherryEarned,
  };
}

export function scoreWrong(score) {
  return {
    score: { ...score },
    fireworks: false,
    cherryEarned: false,
  };
}
