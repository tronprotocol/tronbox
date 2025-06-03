#!/usr/bin/env bash

echo 'Test abiv2'
cd abiv2
rm -rf build
../../tronbox.dev test
cd ..

echo 'Test tre'
cd tre
rm -rf build
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
TRONBOX_CREATE_JAVASCRIPT_PROJECT_WITH_DEFAULTS=true ../../tronbox.dev init
../../tronbox.dev migrate
cd ..

echo 'Test init metacoin'
rm -rf build
mkdir build
cd build
TRONBOX_CREATE_JAVASCRIPT_METACOIN_PROJECT_WITH_DEFAULTS=true ../../tronbox.dev init
../../tronbox.dev test
cd ..

echo 'Test unbox metacoin'
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

echo 'Test evm'
cd evm
rm -rf build
../../tronbox.dev test --evm
cd ..
