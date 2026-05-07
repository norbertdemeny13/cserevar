#!/usr/bin/env bash
# Static assets for cPanel / production (replaces gulp default on Node 16+).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -d node_modules/sass ]]; then
  echo "Run: npm install" >&2
  exit 1
fi

./node_modules/.bin/sass scss/agency.scss css/agency.css --style=expanded --no-source-map
npx --yes clean-css-cli -o css/agency.min.css css/agency.css
npx --yes uglify-js js/agency.js -o js/agency.min.js -c -m

rm -rf vendor/bootstrap
mkdir -p vendor/bootstrap
cp -R node_modules/bootstrap/dist/. vendor/bootstrap/
rm -f vendor/bootstrap/css/bootstrap-grid* vendor/bootstrap/css/bootstrap-reboot* 2>/dev/null || true

rm -rf vendor/jquery vendor/jquery-easing
mkdir -p vendor/jquery vendor/jquery-easing
cp node_modules/jquery/dist/* vendor/jquery/
rm -f vendor/jquery/core.js 2>/dev/null || true
cp node_modules/jquery.easing/*.js vendor/jquery-easing/

rm -rf vendor/fontawesome-free
cp -R node_modules/@fortawesome/fontawesome-free vendor/fontawesome-free

echo "OK: css/agency.min.css, js/agency.min.js, vendor/* (bootstrap, jquery, fontawesome-free)"
