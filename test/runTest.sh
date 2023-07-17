#!/usr/bin/env bash

echo 'Test abiv2'
cd abiv2
../../tronbox.dev test
cd ..

echo 'Test tre'
cd tre
../../tronbox.dev test
cd ..

echo 'Test openzeppelin'
cd openzeppelin
. runTest.sh
cd ..

echo 'Test init'
rm -rf build
mkdir build
cd build
../../tronbox.dev init
../../tronbox.dev migrate
cd ..

echo 'Test metacoin'
rm -rf build
mkdir build
cd build
../../tronbox.dev unbox metacoin-box
../../tronbox.dev test
cd ..

rm -rf build

echo 'Test Console.log'
cd consolelogs
sh runTest.sh
cd ..
