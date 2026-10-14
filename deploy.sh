#!/bin/sh
# Deploy Wörter to hosting.
#
# Run it from your laptop after pushing to GitHub:
#
#     ssh <member>_<site>@ssh.<dc>.hosting.com /home/private/deutsch/deploy.sh
#
# It pulls main into the clone in /home/private and copies the game into
# /home/public/woerter, so the site lives at <domain>/woerter/ and
# other projects can sit beside it under the same document root.
# Safe to run repeatedly: the pull is --ff-only and the copy is a full mirror.

set -eu

REPO=$(cd "$(dirname "$0")" && pwd)
DOCROOT=${DOCROOT:-/home/public/woerter}

echo "Pulling main into $REPO"
git -C "$REPO" pull --ff-only origin main

# An allowlist, deliberately. woerter/ also holds working material -- source
# PDFs, notes, draft word lists -- and a list of things to exclude would publish
# each new one the moment it was added. Add a line here when the site gains a file.
#
# --delete mirrors $DOCROOT exactly, but $DOCROOT is the woerter/ subdirectory,
# so sibling projects under /home/public are never touched.
echo "Publishing woerter/ to $DOCROOT"
mkdir -p "$DOCROOT"
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
