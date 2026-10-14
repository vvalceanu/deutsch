#!/bin/sh
# Deploy Wörter to hosting.
#
# Run it from your laptop after pushing to GitHub:
#
#     ssh <member>_<site>@ssh.<dc>.hosting.com /home/private/deutsch/deploy.sh
#
# It pulls main into the clone in /home/private, copies the game into the
# document root, and leaves the repository itself off the web.
# Safe to run repeatedly: the pull is --ff-only and the copy is a full mirror.

set -eu

REPO=$(cd "$(dirname "$0")" && pwd)
DOCROOT=${DOCROOT:-/home/public}

echo "Pulling main into $REPO"
git -C "$REPO" pull --ff-only origin main

# An allowlist, deliberately. woerter/ also holds working material -- source
# PDFs, notes, draft word lists -- and a list of things to exclude would publish
# each new one the moment it was added. Add a line here when the site gains a file.
echo "Publishing woerter/ to $DOCROOT"
rsync -a --delete --delete-excluded \
  --include '/index.html' \
  --include '/style.css' \
  --include '/words2.json' \
  --include '/.htaccess' \
  --include '/js/***' \
  --exclude '*' \
  "$REPO/woerter/" "$DOCROOT/"

# The documented fix for files the web server cannot read.
echo "Setting permissions"
find "$DOCROOT" -type d -exec chmod 755 {} \;
find "$DOCROOT" -type f -exec chmod 644 {} \;

echo "Live: $(git -C "$REPO" rev-parse --short HEAD) $(git -C "$REPO" log -1 --format=%s)"
