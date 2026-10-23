/** Wires the pieces together and starts the game. */

import { createFireworks } from './fireworks.js';
import { createStorage } from './storage.js';
import { createGameUi } from './ui.js';

const elements = {
  pips: document.getElementById('pips'),
  cherries: document.querySelector('.cherries'),
  cherryCount: document.getElementById('cherry-count'),
  modes: document.getElementById('modes'),
  number: document.getElementById('number'),
  worth: document.getElementById('worth'),
  gain: document.getElementById('gain'),
  line: document.getElementById('line'),
  markLeft: document.querySelector('#mark-left span'),
  markRight: document.querySelector('#mark-right span'),
  status: document.getElementById('status'),
  next: document.getElementById('next'),
};

createGameUi({
  elements,
  storage: createStorage(),
  fireworks: createFireworks(document.getElementById('sky')),
}).start();
