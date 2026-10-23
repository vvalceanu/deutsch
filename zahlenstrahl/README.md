# Zahlenstrahl

Ein Spiel: wo liegt die Zahl auf dem Zahlenstrahl?

A number (say 67) and a line with two marks on it (say 50 and 70). The kid taps
the part of the line where the number belongs: left of the marks (*kleiner*),
between them (*dazwischen*) or right of them (*grösser*). Then the number drops
onto the line where it really sits, with the comparison underneath
(`50 < 67 < 70`), and stays there until the arrow is pressed.

Fireworks for every correct answer. Every ten points become a cherry, with bigger
fireworks; points past ten carry over. A wrong tap costs nothing. Score and mode
live in localStorage under `zahlenstrahl.v1`.

## Levels

| Level | Numbers | Marks | Distance between marks | Points |
|---|---|---|---|---|
| 1 | 1–50 | round (10, 20, …) | 10–30 | 1 |
| 2 | 1–30 | never round | 10–30 | 2 |
| 3 | 1–99 | round | 10–30 | 2 |
| 4 | 1–99 | never round | 10–30 | 3 |
| 5 | 1–99 | never round | 2–7 | 4 |

The dots under the number show what a question is worth.

Each question first draws its answer, left, between or right, a third of the time
each, so no side is a safe guess. Then it draws a number that answer is possible
for, then a pair of marks among every pair the level allows. A number outside
the marks is never far outside them (at most 15, or 10 on level 2, or 6 on
level 5), so "left" never means "obviously miles away". A number never equals a
mark, and the same number never comes twice in a row. All of it is in
`js/levels.js`, and the knobs are in the `LEVELS` table there.

## The A / B / C switch

The dim switch in the top right corner is for the grown-up:

- **A**: level 1 only
- **B**: levels 1, 2 and 3, mixed
- **C**: all five levels, mixed

Switching swaps an unanswered question straight away. The choice is remembered.

## Running it

```sh
python3 -m http.server 8000   # then open http://localhost:8000/
```

A web server is required: ES modules do not work over `file://`.

Keys, for a desk: arrow keys or 1/2/3 answer; Enter or space goes on.

## Tests

```sh
node --test
```

Tests cover the pure logic: every level's rules over thousands of generated
questions, the even spread of answers, the modes, scoring with carry-over, and
storage. No dependencies; `node:test` ships with Node.

## Deploying

Static files, no build step. The site lives at **deutsch.xxx.com/zahlenstrahl/**,
deployed together with the other projects by `deploy.sh` at the repository root:

    ssh <user>@<host> /home/private/deutsch/deploy.sh

It copies an explicit allowlist into `/home/public/zahlenstrahl`: `index.html`,
`style.css`, `.htaccess` and `js/`. **If you add a file the site needs, add it to
that allowlist** in `deploy.sh`, or it will not be published.

The landing page (`site/index.html`) has a card for it and is installed by hand:

    cp /home/private/deutsch/site/index.html /home/public/index.html

## Layout

```
index.html        markup shell
style.css         night sky, the line, the landscape-phone squeeze
js/levels.js      levels, modes, question generation, pure
js/score.js       points and cherries, pure
js/storage.js     localStorage, degrades to memory when blocked
js/fireworks.js   canvas particle burst (a copy of Wörter's)
js/ui.js          the only file that touches the DOM
js/main.js        wiring
```
