#!/usr/bin/env bash

(
cd packages/tronwrap/tron-web
yarn build -p
)
(
cd packages/tronbox
yarn run prepare
)
