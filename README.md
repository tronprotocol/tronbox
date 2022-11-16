# TronBox
TronBox is a smart contract development, testing, and deployment tool for blockchains using the TRON Virtual Machine (TVM). 
TronBox allows you to:
- Use built-in functions for smart contract compilation, linking, deployment and binary management
- Execute external scripts in the TronBox environment
- Communicate directly with contracts using interactive console tools
- Efficiently develop automated contract testing
- Make contract deployment and migration scriptable & extensible
- Deploy contracts to any number of public & private TRE networks with powerful network management capabilities

TronBox is a fork of [Truffle](https://www.trufflesuite.com/truffle).

## Quick Usage
Installation
```
$ npm install -g tronbox
```
详细安装请参考安装说明。
_Note: To verify the PGP signature, see [here](https://github.com/jz2120100058/tronbox/blob/master/FURTHER_INFO.md#verifying-the-pgp-signature)._

To create a default Tron-Box Project：
```
$ tronbox init
```

To download a dApp (for example, metacoin-box):
```
$ tronbox unbox metacoin
```
To compile a contract:
```
$ tronbox compile
```

To compile all contracts, use the ```--compile-all``` option.
 
Specify a network using the ```--network``` option. Network name must exist in the configuration.

To deploy a contract
```
$ tronbox migrate
```

To carry out the test, run the following command:
```
$ tronbox test
```


## Development
For advanced information for development, see:
- [Configuration](https://github.com/jz2120100058/tronbox/blob/master/FURTHER_INFO.md#configuration)
- [Contract Migration](https://github.com/jz2120100058/tronbox/blob/master/FURTHER_INFO.md#contract-migration)
- [TronBox Console](https://github.com/jz2120100058/tronbox/blob/master/FURTHER_INFO.md#tronbox-console)
- [Testing](https://github.com/jz2120100058/tronbox/blob/master/FURTHER_INFO.md#testing)
- [Contributing](https://github.com/jz2120100058/tronbox/blob/master/CONTRIBUTING.md)


