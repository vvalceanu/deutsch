/** Wires the pieces together and starts the game. */

import { createFireworks } from './fireworks.js';
import { createQueue } from './queue.js';
import { createStorage } from './storage.js';
import { createGameUi } from './ui.js';
import { loadBatch } from './words.js';

const elements = {
  pips: document.getElementById('pips'),
  cherries: document.querySelector('.cherries'),
  cherryCount: document.getElementById('cherry-count'),
  choices: document.getElementById('choices'),
  hintRo: document.getElementById('hint-ro'),
  hintDef: document.getElementById('hint-def'),
  next: document.getElementById('next'),
  status: document.getElementById('status'),
};

createGameUi({
  elements,
  queue: createQueue(() => loadBatch()),
  storage: createStorage(),
  fireworks: createFireworks(document.getElementById('sky')),
}).start();
