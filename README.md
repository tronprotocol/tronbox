# TronBox v3.0.0
Simple development framework for TronWeb
**TronBox is a fork of [Truffle](https://www.trufflesuite.com/truffle) [code](https://github.com/trufflesuite/truffle)**

## Installation
```
$ npm install -g tronbox
```

## Quick Usage
To create a default Customer Tron-Box Project：
```
$ tronbox init
```

Download a dApp, ex: metacoin-box
```
$ tronbox unbox metacoin
```
Contract Compiler
```
$ tronbox compile
```

To compile for all contracts, select --compile-all.

Optionally, you can select: <br>
--compile-all: Force compile all contracts. <br>
--network save results to a specific host network<br>
<br>




You can find the signature public key [here](https://keybase.io/tronbox/pgp_keys.asc).

## How to contribute

1. Fork this repo.

2. Clone your forked repo recursively, to include submodules, for example:
```shell script
git clone --recurse-submodules -j8 git@github.com:sullof/tronbox.git
```
3. If you use nvm for Node, please install Node >=8:
```shell script
nvm install v8.16.0
nvm use v8.16.0
```
4. Install the project's dependencies:
```shell script
npm install
```
5. During the development, for better debugging, you can run the unbuilt version of TronBox, for example
```shell script
./tronbox.dev migrate --reset
```

## TronBox Changelog

for more details: [CHANGELOG](./CHANGELOG.md)
