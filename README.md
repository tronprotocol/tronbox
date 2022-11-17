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
### Install<br>
Before you can use TronBox, install it using the npm command. For details, see Installation.
```
$ npm install -g tronbox
```
_Note: To verify the PGP signature, see [here](https://github.com/jz2120100058/tronbox/blob/master/FURTHER_INFO.md#verifying-the-pgp-signature)._

### Create a default Tron-Box Project
```
$ tronbox init
```
Once this operation is completed, you'll now have a project structure with the following items:

contracts/: Directory for Solidity contracts<br>
migrations/: Directory for scriptable deployment files<br>
test/: Directory for test files for testing your application and contracts<br>
tronbox.js: TronBox configuration file<br>

### Compile
If you want to only compile, you can simply run tronbox compile. For details, see Complie.
```
$ tronbox compile
```

To compile all contracts, use the ```--compile-all``` option.<br>
Specify a network using the ```--network``` option. Network name must exist in the configuration.

### Migrate
To deploy our smart contracts, we're going to need to connect to a blockchain. We can use the TronBox Runtime Environment to launch and interact with the blockchain, then migrate the contract to the blockchain. For details, see Migrate.
```
$ tronbox migrate
```
### Test
To run all tests, you can simply run tronbox test. For details, see Test.
```
$ tronbox test
```
### Interact with the contract<br>
To interact with the contract, you can use the tronBox console. For details, see Interact.
```
$ tronbox console
```
## Development
The quickusage showed you the basics of the TronBox project lifecycle, but there is much more to learn. For advanced information for development, Please see the [Official TronBox Documentation](https://github.com/jz2120100058/tronbox/blob/master/FURTHER_INFO.md) for guides, tips, and examples.

To contribute, see [CONTRIUTING.MD](https://github.com/jz2120100058/tronbox/blob/master/CONTRIBUTING.md).


