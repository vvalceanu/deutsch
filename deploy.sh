#!/bin/sh
# Deploy the projects to hosting.
#
# Run it from your laptop after pushing to GitHub:
#
#     ssh <member>_<site>@ssh.<dc>.hosting.com /home/private/deutsch/deploy.sh
#
# It pulls main into the clone in /home/private and copies each project into
# its own subdirectory of /home/public -- woerter/ to <domain>/woerter/,
# kantonspiel/ to <domain>/kantonspiel/ -- so the projects sit side by side
# under the same document root.
# Safe to run repeatedly: the pull is --ff-only and each copy is a full mirror.

set -eu

REPO=$(cd "$(dirname "$0")" && pwd)
PUBLIC=${PUBLIC:-/home/public}

echo "Pulling main into $REPO"
git -C "$REPO" pull --ff-only origin main

# publish <project> <rsync filter args...>
#
# Mirrors $REPO/<project>/ into $PUBLIC/<project>/, keeping only what the
# filters include. The destination is always a named subdirectory, so --delete
# can never reach /home/public itself, the landing page, or a sibling project.
publish() {
  project=$1
  shift
  dest="$PUBLIC/$project"
  echo "Publishing $project/ to $dest"
  mkdir -p "$dest"
  rsync -a --delete --delete-excluded "$@" --exclude '*' \
    "$REPO/$project/" "$dest/"

  # The documented fix for files the web server cannot read.
  find "$dest" -type d -exec chmod 755 {} \;
  find "$dest" -type f -exec chmod 644 {} \;
}

# Allowlists, deliberately. The project folders also hold working material --
# source PDFs, notes, draft word lists -- and a list of things to exclude would
# publish each new one the moment it was added. Add a line here when a site
# gains a file.
publish woerter \
  --include '/index.html' \
  --include '/style.css' \
  --include '/words2.json' \
  --include '/.htaccess' \
  --include '/js/***'

publish kantonspiel \
  --include '/index.html' \
  --include '/.htaccess' \
  --include '/flags/' \
  --include '/flags/*.svg'

echo "Live: $(git -C "$REPO" rev-parse --short HEAD) $(git -C "$REPO" log -1 --format=%s)"
