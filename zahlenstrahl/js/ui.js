/**
 * The only file that touches the document.
 *
 * One number at a time, two marks on the line, one tap on the part of the line
 * where the number belongs. Then the number drops onto the line where it really
 * sits and stays there until the arrow is pressed — nothing advances on a timer.
 */

import { makeQuestion, pickLevel } from './levels.js';
import { scoreCorrect, POINTS_PER_CHERRY } from './score.js';

const ZONE_KEYS = { ArrowLeft: 'left', 1: 'left', ArrowDown: 'middle', 2: 'middle', ArrowRight: 'right', 3: 'right' };

export function createGameUi({ elements, storage, fireworks }) {
  let { score, mode } = storage.load();
  let question = null;
  let answered = false;
  // Moving focus is only helpful to someone navigating by keyboard. Doing it
  // for a kid with a finger just makes one zone look pre-picked.
  let usingKeyboard = false;

  const zones = [...elements.line.querySelectorAll('.zone')];
  const zoneButton = (zone) => zones.find((b) => b.dataset.zone === zone);

  function save() {
    storage.save({ score, mode });
  }

  function renderTally({ popFrom = null, minted = false } = {}) {
    const pips = Array.from({ length: POINTS_PER_CHERRY }, (_, i) => {
      const pip = document.createElement('span');
      pip.className = i < score.pips ? 'pip filled' : 'pip';
      if (popFrom !== null && i >= popFrom && i < score.pips) pip.classList.add('just-filled');
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

  function renderModes() {
    for (const button of elements.modes.querySelectorAll('button')) {
      const on = button.dataset.mode === mode;
      button.setAttribute('aria-checked', String(on));
      button.tabIndex = on ? 0 : -1;
    }
  }

  function renderQuestion() {
    const { n, left, right, points } = question;

    elements.number.textContent = String(n);
    elements.number.classList.remove('arrive');
    void elements.number.offsetWidth;
    elements.number.classList.add('arrive');

    elements.worth.replaceChildren(...Array.from({ length: points }, () => document.createElement('i')));
    elements.gain.classList.remove('show');

    elements.markLeft.textContent = String(left);
    elements.markRight.textContent = String(right);

    const labels = {
      left: `kleiner als ${left}`,
      middle: `zwischen ${left} und ${right}`,
      right: `grösser als ${right}`,
    };
    for (const button of zones) {
      button.className = 'zone';
      button.disabled = false;
      button.setAttribute('aria-label', labels[button.dataset.zone]);
      button.querySelector('.chip').textContent = String(n);
    }
  }

  function comparison({ n, left, right, zone }) {
    const math = (text) => `<span class="math">${text}</span>`;
    if (zone === 'left') return math(`${n} &lt; ${left}`);
    if (zone === 'right') return math(`${n} &gt; ${right}`);
    return math(`${left} &lt; ${n} &lt; ${right}`);
  }

  function answer(zone) {
    if (answered || !question) return;
    answered = true;

    for (const button of zones) button.disabled = true;
    const chosen = zoneButton(zone);
    const right = zoneButton(question.zone);
    right.classList.add('correct', 'placed');

    if (zone === question.zone) {
      for (const button of zones) if (button !== chosen) button.classList.add('faded');

      const popFrom = score.pips;
      const result = scoreCorrect(score, question.points);
      score = result.score;
      save();
      renderTally({ popFrom: result.cherryEarned ? null : popFrom, minted: result.cherryEarned });

      elements.gain.textContent = `+${question.points}`;
      elements.gain.classList.add('show');
      fireworks.burst({ big: result.cherryEarned });
      elements.status.innerHTML = `Richtig! ${comparison(question)}`;
    } else {
      chosen.classList.add('wrong');
      for (const button of zones) if (button !== chosen && button !== right) button.classList.add('faded');
      elements.status.innerHTML = comparison(question);
    }

    elements.next.hidden = false;
    if (usingKeyboard) elements.next.focus();
  }

  function nextQuestion() {
    answered = false;
    elements.next.hidden = true;
    elements.status.textContent = '';

    question = makeQuestion(pickLevel(mode), { avoid: question?.n ?? null });
    renderQuestion();
    if (usingKeyboard) zoneButton('left').focus();
  }

  function chooseMode(next) {
    if (next === mode) return;
    mode = next;
    save();
    renderModes();
    // A question still waiting for an answer is swapped for one of the new mode
    // straight away; an answered one stays on screen until the arrow.
    if (!answered) nextQuestion();
  }

  for (const button of zones) {
    button.addEventListener('click', () => answer(button.dataset.zone));
  }

  elements.modes.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-mode]');
    if (button) chooseMode(button.dataset.mode);
  });

  elements.next.addEventListener('click', nextQuestion);

  document.addEventListener('pointerdown', () => { usingKeyboard = false; });

  // Arrow keys or 1-2-3 answer; Enter or space advances from anywhere. Taking
  // the key here and cancelling it — rather than letting the focused button
  // activate itself — keeps one keypress to exactly one action.
  document.addEventListener('keydown', (event) => {
    usingKeyboard = true;
    if (event.target.closest?.('.modes')) return;

    if (answered && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      nextQuestion();
    } else if (!answered && Object.hasOwn(ZONE_KEYS, event.key)) {
      event.preventDefault();
      answer(ZONE_KEYS[event.key]);
    }
  });

  return {
    start() {
      renderTally();
      renderModes();
      nextQuestion();
    },
  };
}
