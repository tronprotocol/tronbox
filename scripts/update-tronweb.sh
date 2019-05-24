#!/usr/bin/env bash

(
cd packages/tronwrap/tronweb
git reset --hard
git checkout master
git pull origin master
yarn install
yarn build
)
