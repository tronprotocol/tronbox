#!/bin/sh

npm i

cd transparent && rm -rf build && rm -rf .openzeppelin && npm i
../../../tronbox.dev migrate
cd ..

cd uups && rm -rf build && rm -rf .openzeppelin && npm i
../../../tronbox.dev migrate
cd ..

cd beacon && rm -rf build && rm -rf .openzeppelin && npm i
../../../tronbox.dev migrate
cd ..
