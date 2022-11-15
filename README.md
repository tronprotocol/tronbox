# TronBox v3.0.0
TronBox is a smart contract development, testing, and deployment tool for blockchains using the TRON Virtual Machine (TVM). 
TronBox allows you to:
- Use built-in functions for smart contract compilation, linking, deployment and binary management
- Execute external scripts in the TronBox environment
- Communicate directly with contracts using interactive console tools
- Efficiently develop automated contract testing
- Make contract deployment and migration scriptable & extensible
- Deploy contracts to any number of public & private TRE networks with powerful network management capabilities

**TronBox is a fork of [Truffle](https://www.trufflesuite.com/truffle).**

## Installation
```
$ npm install -g tronbox
```

_Note: For OS requirements, see [here](https://github.com/jz2120100058/tronbox/blob/master/FURTHER_INFO.md#os-requirement). To verify the PGP signature, see [here](https://github.com/jz2120100058/tronbox/blob/master/FURTHER_INFO.md#verifying-the-pgp-signature)._

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

To compile for all contracts, select ```--compile-all```.

## Development
For advanced information for development, see:
- [Configuration](https://github.com/jz2120100058/tronbox/blob/master/FURTHER_INFO.md#configuration)
- [Contract Migration](https://github.com/jz2120100058/tronbox/blob/master/FURTHER_INFO.md#contract-migration)
- [TronBox Console](https://github.com/jz2120100058/tronbox/blob/master/FURTHER_INFO.md#tronbox-console)
- [Testing](https://github.com/jz2120100058/tronbox/blob/master/FURTHER_INFO.md#testing)


## How to contribute

1. Fork this repository.

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
