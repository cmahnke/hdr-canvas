#!/usr/bin/env bash

set -e

npm ci
npm run lint
npm run format
npx tsc -b --verbose
npx rollup --config
npx prettier --check .
npm run build
npm run site
