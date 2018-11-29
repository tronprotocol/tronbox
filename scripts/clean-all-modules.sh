#!/usr/bin/env bash

rm -rf node_modules
scripts/purgeNode_modules.sh
(cd packages && ../scripts/purgeNode_modules.sh)

