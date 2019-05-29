#!/usr/bin/env bash

purge () {
  for file in */ ; do
    if [[ -d "$file" && ! -L "$file" ]]; then
      echo "Purging "$file"node_modules"
      rm -rf $file"node_modules"
    fi
  done
}


(
  rm -rf $file"node_modules"
  cd packages
  purge
  cd packages/tronwrap
  purge
)
