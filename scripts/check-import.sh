#!/usr/bin/env bash

set -e

cd tests/import

npm cache clean --force
rm -rf node_modules
npm i --no-package-lock --prefix ./

npm run build
