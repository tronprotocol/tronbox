#!/usr/bin/env bash

(
cd packages/tronwrap/tronweb
yarn build -p
)
(
cd packages/tronbox
yarn run prepare
)
