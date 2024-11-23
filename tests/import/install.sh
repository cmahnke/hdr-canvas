#!/bin/sh

#export NODE_OPTIONS="--require=suppress-experimental-warnings --experimental-loader=node-esm-loader"
rm -rf node_modules package-lock.json
npm i --no-package-lock $1 --prefix ./
