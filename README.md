# TronBox
TronBox is a tool for developing, testing, and deploying smart contracts. It is designed for blockchains using the TRON Virtual Machine (TVM).

* Built-in smart contract compilation, linking, deployment, and binary management.
* External script runner that executes scripts within a TronBox environment.
* Interactive console for direct contract communication.
* Automated contract testing for rapid development.
* Scriptable, extensible deployment & migrations framework.
* Network management for deploying to any number of public & private networks.

TronBox is a fork of [Truffle](https://www.trufflesuite.com/truffle).

## Quick Start
### Install<br>
Before you can use TronBox, install it using the npm command. For details, see [Install TronBox](https://developers.tron.network/reference/install).
```
$ npm install -g tronbox
```
_Note: To verify the PGP signature, see [here](https://github.com/jz2120100058/tronbox/blob/master/FURTHER_INFO.md#verifying-the-pgp-signature)._<br>
<br>
### Create a default Tron-Box Project
You can create a bare project without smart contracts, run:
```
$ tronbox init
```
Once this operation is completed, you'll now have a project structure with the following items:

`contracts/`: Directory for Solidity contracts<br>
`migrations/`: Directory for scriptable deployment files<br>
`test/`: Directory for test files for testing your application and contracts<br>
`tronbox.js`: TronBox configuration file<br>

For those getting started, you can use TronBox Boxes, which offers example applications and project templates. For details, see [Create a TronBox Project](https://developers.tron.network/reference/create-a-tronbox-project).<br>
<br>
### Compile
If you want to only compile, run:
```
$ tronbox compile
```
To compile all contracts, use the ```--compile-all``` option.<br>
Specify a network using the ```--network``` option. Network name must exist in the configuration. For details, see [Compile a Project](https://developers.tron.network/reference/compile-a-contract).<br>
<br>
### Migrate
To deploy our smart contracts, you need to connect to a blockchain. Use the **TronBox Runtime Environment** to create and interact with the blockchain. For details, see [Contract Deployment(Migrations)](https://developers.tron.network/reference/contract-deploymentmigrations). Then migrate the contract to the blockchain by running:
```
$ tronbox migrate
```

### Test
To run all tests, run:
```
$ tronbox test
```
Alternatively, you can specify a path to a specific file you want to run:`tronbox test ./path/to/test/file.js`. For details, see [Test Your Contracts](https://developers.tron.network/reference/test-your-contracts).  
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
The name in the parentheses of the prompt `tronbox(development)>` is the network that is currently connected to. For details, see [Interact with a Contract](https://developers.tron.network/reference/interact-with-a-contract).<br>
<br>
## Development
To dive deeper into advanced topics of the TronBox project lifecycle, please see the [Official TronBox Documentation](https://developers.tron.network/reference/what-is-tronbox) for guides, tips, and examples.

To contribute, see [CONTRIUTING.MD](https://github.com/jz2120100058/tronbox/blob/master/CONTRIBUTING.md).


