#!/usr/bin/env bash

(
cd packages/tronwrap/tron-web
export NODE_ENV=development && yarn run build
)

(
cd packages/tronbox
yarn run prepare
chmod +x packages/tronbox/build/cli.bundled.js
)
