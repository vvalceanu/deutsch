/**
 * The only file that touches the document.
 *
 * One word at a time: four spellings, one tap, then the answer stands on screen
 * until the arrow is pressed. Nothing advances on a timer — the kid decides
 * when they are done looking at the correct spelling.
 */

import { buildChallenge } from './challenge.js';
import { scoreCorrect, scoreWrong, POINTS_PER_CHERRY } from './score.js';

export function createGameUi({ elements, queue, storage, fireworks }) {
  let score = storage.load();
  let challenge = null;
  let answered = false;
  // Moving focus is only helpful to someone navigating by keyboard. Doing it
  // for a kid with a finger just makes one tile look pre-picked.
  let usingKeyboard = false;

  function renderTally({ pop = false, minted = false } = {}) {
    const pips = Array.from({ length: POINTS_PER_CHERRY }, (_, i) => {
      const pip = document.createElement('span');
      pip.className = i < score.pips ? 'pip filled' : 'pip';
      if (pop && i === score.pips - 1) pip.classList.add('just-filled');
      return pip;
    });
    elements.pips.replaceChildren(...pips);
    elements.pips.setAttribute(
      'aria-label',
      `${score.pips} von ${POINTS_PER_CHERRY} Punkten bis zur nächsten Kirsche`,
    );
    elements.cherryCount.textContent = String(score.cherries);

    if (minted) {
      elements.cherries.classList.remove('minted');
      void elements.cherries.offsetWidth; // forces the animation to run again
      elements.cherries.classList.add('minted');
    }
  }

  function renderChallenge() {
    elements.choices.replaceChildren(
      ...challenge.choices.map((choice) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'choice';
        button.lang = 'de';
        button.textContent = choice;
        button.addEventListener('click', () => answer(choice, button));
        return button;
      }),
    );

    elements.hintRo.textContent = challenge.ro;
    elements.hintRo.lang = 'ro';
    elements.hintDef.textContent = challenge.def;
    elements.hintDef.lang = 'de';
  }

  function answer(choice, button) {
    if (answered) return;
    answered = true;

    const tiles = [...elements.choices.children];
    for (const tile of tiles) tile.disabled = true;

    const correct = choice === challenge.word;
    queue.answered(challenge.word, correct);

    if (correct) {
      button.classList.add('correct');
      for (const tile of tiles) if (tile !== button) tile.classList.add('faded');
      const result = scoreCorrect(score);
      score = result.score;
      storage.save(score);
      renderTally({ pop: !result.cherryEarned, minted: result.cherryEarned });

      if (result.cherryEarned) fireworks.burst({ big: true });
      else if (result.fireworks) fireworks.burst();

      say('Richtig!');
    } else {
      button.classList.add('wrong');
      scoreWrong(score);

      for (const tile of tiles) {
        if (tile.textContent === challenge.word) tile.classList.add('correct');
        else if (tile !== button) tile.classList.add('faded');
      }

      say(`Leider falsch. Richtig ist: ${challenge.word}`);
    }

    elements.next.hidden = false;
    if (usingKeyboard) elements.next.focus();
  }

  function say(message) {
    elements.status.textContent = message;
  }

  async function nextWord() {
    answered = false;
    elements.next.hidden = true;
    say('');

    try {
      challenge = buildChallenge(await queue.next());
    } catch (error) {
      showTrouble(error);
      return;
    }

    renderChallenge();
    if (usingKeyboard) elements.choices.firstElementChild?.focus();
  }

  function showTrouble(error) {
    console.error('[woerter]', error);
    elements.choices.replaceChildren();
    // the definition sits above the choices now, so the main message goes there
    elements.hintDef.textContent = 'Die Wörter sind gerade nicht da.';
    elements.hintDef.className = 'trouble';
    elements.hintRo.textContent = 'Bitte die Seite neu laden.';
    elements.hintRo.className = 'trouble';
  }

  elements.next.addEventListener('click', nextWord);

  // Enter or space advances from anywhere, so the kid never has to find the
  // arrow with the keyboard. Taking the key here and cancelling it — rather
  // than letting the focused button activate itself — keeps one keypress to
  // exactly one word, however focus happens to be sitting.
  document.addEventListener('pointerdown', () => { usingKeyboard = false; });

  document.addEventListener('keydown', (event) => {
    usingKeyboard = true;
    if (!answered) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      nextWord();
    }
  });

  return {
    async start() {
      renderTally();
      await nextWord();
    },
  };
}
