# Kantonspiel

Ein Spiel: welcher Kanton ist das?

A flag of one of the 26 Swiss cantons and three names to choose from. Five right
answers fill five stars and earn fireworks; a wrong pick shows the right name
and costs nothing. The running total of stars lives in localStorage.

## Running it

```sh
python3 -m http.server 8000   # then open http://localhost:8000/
```

## Deploying

Static files, no build step. The site lives at **deutsch.xxx.com/kantonspiel/**,
deployed together with Wörter by `deploy.sh` at the repository root:

    ssh <user>@<host> /home/private/deutsch/deploy.sh

It copies an explicit allowlist into `/home/public/kantonspiel`: `index.html`,
`.htaccess` and `flags/*.svg`. **If you add a file the site needs, add it to that
allowlist** in `deploy.sh`, or it will not be published.

## Layout

```
index.html      the whole game: markup, style, script
flags/<id>.svg  one flag per canton, named by its two-letter code
.htaccess       charset and caching
```
