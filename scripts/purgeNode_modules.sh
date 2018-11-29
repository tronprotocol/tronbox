#!/usr/bin/env bash
for file in */ ; do
  if [[ -d "$file" && ! -L "$file" ]]; then
  	echo "Purging "$file"node_modules"
    rm -rf $file"node_modules"
  fi
done
