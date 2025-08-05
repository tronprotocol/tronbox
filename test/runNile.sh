#!/usr/bin/env bash

echo 'Nile: Test abiv2'
cd abiv2
rm -rf build
../../tronbox.dev migrate --network nile
cd ..

echo 'Nile: Test init'
rm -rf build
mkdir build
cd build
TRONBOX_CREATE_JAVASCRIPT_PROJECT_WITH_DEFAULTS=true ../../tronbox.dev init
../../tronbox.dev migrate --network nile
cd ..

echo 'Nile: Test init metacoin'
rm -rf build
mkdir build
cd build
TRONBOX_CREATE_JAVASCRIPT_METACOIN_PROJECT_WITH_DEFAULTS=true ../../tronbox.dev init
../../tronbox.dev migrate --network nile
cd ..

echo 'Nile: Test unbox metacoin'
rm -rf build
mkdir build
cd build
../../tronbox.dev unbox metacoin-box
../../tronbox.dev migrate --network nile
cd ..

echo 'Nile: Test unbox beacon'
rm -rf build
mkdir build
cd build
../../tronbox.dev unbox beacon
../../tronbox.dev migrate --network nile
cd ..

echo 'Nile: Test unbox transparent'
rm -rf build
mkdir build
cd build
../../tronbox.dev unbox transparent
../../tronbox.dev migrate --network nile
cd ..

echo 'Nile: Test unbox uups'
rm -rf build
mkdir build
cd build
../../tronbox.dev unbox uups
../../tronbox.dev migrate --network nile
cd ..

rm -rf build

echo 'BTTC: Test evm'
cd evm
rm -rf build
../../tronbox.dev migrate --network bttc --evm
cd ..
