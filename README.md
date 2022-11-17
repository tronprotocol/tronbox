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
Before you can use TronBox, install it using the npm command. For details, see [Installation](url).
```
$ npm install -g tronbox
```
_Note: To verify the PGP signature, see [here](https://github.com/jz2120100058/tronbox/blob/master/FURTHER_INFO.md#verifying-the-pgp-signature)._

### Create a default Tron-Box Project
* You can create a bare project without smart contracts, run:
* To create a default set of contracts and tests, run:
```
$ tronbox init
```
Once this operation is completed, you'll now have a project structure with the following items:

`contracts/`: Directory for Solidity contracts<br>
`migrations/`: Directory for scriptable deployment files<br>
`test/`: Directory for test files for testing your application and contracts<br>
`tronbox.js`: TronBox configuration file<br>

For those getting started, you can use TronBox Boxes, which offers example applications and project templates. For details, see [Create](url).<br>
<br>
### Compile
If you want to only compile, run:
```
$ tronbox compile
```
To compile all contracts, use the ```--compile-all``` option.<br>
Specify a network using the ```--network``` option. Network name must exist in the configuration. For details, see [Complie](url).<br>
<br>
### Migrate
To deploy our smart contracts, you need to connect to a blockchain. Use the **TronBox Runtime Environment** to create and interact with the blockchain. For details, see [Migrate](url). Then migrate the contract to the blockchain by running:
```
$ tronbox migrate
```

### Test
To run all tests, run:
```
$ tronbox test
```
Alternatively, you can specify a path to a specific file you want to run:`tronbox test ./path/to/test/file.js`. For details, see [Test](url).  
<br>
### Interact with the contract<br>
To interact with the contract, run:
```
$ tronbox console
```
You will see the following prompt:
```
$ tronbox(development)>
``` 
The name in the parentheses of the prompt `tronbox(development)>` is the network that is currently connected to. For details, see [Interact](url).<br>
<br>
## Development
To dive deeper into advanced topics of the TronBox project lifecycle, please see the [Official TronBox Documentation](https://github.com/jz2120100058/tronbox/blob/master/FURTHER_INFO.md) for guides, tips, and examples.

To contribute, see [CONTRIUTING.MD](https://github.com/jz2120100058/tronbox/blob/master/CONTRIBUTING.md).


