#!/usr/bin/env bash

(
node_env=p
if [[ "$1" = "d" ]]; then node_env=d; fi
cd packages/tronwrap/tron-web
yarn build "-$node_env"
)
