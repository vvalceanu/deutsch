# Wörter

Ein Spiel: welches Wort ist richtig geschrieben?

A spelling game for a kid that speaks German and must learn how to write.
Four spellings of the same word, one of them correct, the wrong ones being the
possible mistakes, according to school documents that Fable researched.

One point per word answered correctly on the first try, fireworks on every second
point, ten points become a cherry. Cherries are never spent and never capped, and
they live in localStorage. A wrong pick costs nothing — it just shows the correct
spelling and moves on when the kid presses the arrow.

## Running it

```sh
python3 -m http.server 8000   # then open http://localhost:8000/
```

A web server is required: ES modules and `fetch` do not work over `file://`.

## Tests

```sh
node --test
```

42 tests over the pure logic — scoring, the cherry rollover, choice building, batch
refills, storage. No dependencies; `node:test` ships with Node.

## Deploying

Static files, no build step. The site lives at **deutsch.xxx.com/woerter/**, one
of several projects under that domain. Deploying is a push to GitHub, then one
command:

    ssh <user>@<host> /home/private/deutsch/deploy.sh

`deploy.sh`, at the repository root, pulls `main` into the clone in
`/home/private` and copies the game into `/home/public/woerter` (and Kantonspiel
into `/home/public/kantonspiel`, beside it). It is safe to
run repeatedly, and its `--delete` is scoped to that subdirectory, so sibling
projects under `/home/public` are never touched.

What it copies is an explicit allowlist: `index.html`, `style.css`, `words2.json`,
`.htaccess` and `js/`. Everything else in this folder — the source PDFs, the
spelling notes, draft word lists, `tests/`, `package.json` — stays off the web.
**If you add a file the site needs, add it to that allowlist** in `deploy.sh`, or
it will not be published.

Full setup, DNS and TLS steps are in the deployment doc.

### The landing page

`site/index.html` (repository root) is the page at **deutsch.xxx.com/**, listing
the projects under that domain. It is deliberately *not* part of `deploy.sh`:
that script's `--delete` is scoped to `/home/public/woerter`, and keeping it that
way is what makes it safe to run while sibling projects share the document root.

Install or update it by hand — it changes only when a project is added:

    cp /home/private/deutsch/site/index.html /home/public/index.html

Without it, the bare domain 404s, since NFSN serves no directory listings.

## Adding words

`words2.json` holds every word. The shape:

```json
{ "words": [
  { "word": "Stuhl", "ro": "scaun",
    "def": "Möbel zum Sitzen mit Lehne",
    "wrong": ["Shtul", "Stul", "Stül", "Ștul"],
    "level": 1 }
]}
```

- `word` — the correct spelling. **Capitalised**, and every entry in `wrong` must be
  capitalised too, otherwise the kid learns "pick the capitalised one" instead of
  learning the spelling.
- `ro` — the Romanian translation, shown as a small hint under the choices.
- `def` — a short German definition in simple language, shown smaller still.
- `wrong` — plausible misspellings. Give at least three; three of them are drawn at
  random per round. Good sources of mistakes: `sch` → `sh`/`ș`, `w` → `v`,
  `ch` → `h`, `z` → `ț`, dropped umlauts, doubled or missing consonants.
- `level` — school year the word belongs to. The game ignores it today; it is there
  to filter by grade later. Current spread: 345 at level 1, 300 at 2, 239 at 3.

## Where the backend goes

`js/words.js` is the only file that knows where words come from. It fetches the
whole list and picks ten. When the real endpoint exists — its contract is "give me
10 random words" — point `WORDS_URL` at `/api/words?count=10` and drop the
`sample()` call. The response shape is already identical, and nothing else changes:
`js/queue.js` just asks for another batch whenever it runs dry.

## Layout

```
../deploy.sh      pull main and publish (run on the server)
index.html        markup shell
style.css         the orchard palette and layout
words2.json       the word list
js/score.js       scoring rules, pure
js/challenge.js   builds the shuffled choices for one word
js/queue.js       serves words, refills from a loader
js/storage.js     localStorage, degrades to memory when blocked
js/words.js       the backend seam
js/fireworks.js   canvas particle burst
js/ui.js          the only file that touches the DOM
js/main.js        wiring
```

## Not built yet

The typing challenge worth double points.
