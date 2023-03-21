#!/bin/sh

cd transparent && rm -rf build && rm -rf .openzeppelin && npm i
../../../tronbox.dev migrate --network nile
cd ..

cd uups && rm -rf build && rm -rf .openzeppelin && npm i
../../../tronbox.dev migrate --network nile
cd ..

cd beacon && rm -rf build && rm -rf .openzeppelin && npm i
../../../tronbox.dev migrate --network nile
cd ..
