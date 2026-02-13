<p align="center">
  <a href="https://tronbox.io/" title="TronBox Website">
    <img alt="TronBox" src="https://raw.githubusercontent.com/tronprotocol/tronbox/master/assets/TronBox-logo.png" width="160"/>
  </a>
</p>

# TronBox

TronBox is a development framework and testing environment for smart contracts on blockchains using the TRON Virtual Machine (TVM). As a fork of [Truffle](https://www.trufflesuite.com/truffle), TronBox brings familiar workflows and powerful tools to the TRON ecosystem, making it easier to build, test, and deploy decentralized applications.

With TronBox, you get:

- Built-in smart contract compilation, linking, deployment, and binary management.
- An external script runner that executes scripts within a TronBox environment.
- An interactive console for direct contract communication.
- Automated contract testing for rapid development.
- A scriptable, extensible deployment & migrations framework.
- Network management for deploying to any number of public & private networks.

Whether you are migrating from Truffle or starting a new TRON project, TronBox provides a seamless and productive development experience.

## Quick Start

### Install

Before you can use TronBox, install it using the npm command. For details, see [Install TronBox](https://tronbox.io/docs/guides/installation).

```
$ npm install -g tronbox
```

### Create a default TronBox Project

You can create a bare project without smart contracts, run:

```
$ tronbox init
```

Once this operation is completed, you'll now have a project structure with the following items:

`contracts/`: Directory for Solidity contracts

`migrations/`: Directory for scriptable deployment files

`test/`: Directory for test files for testing your application and contracts

`tronbox-config.js`: TronBox configuration file

For those getting started, you can use TronBox Boxes, which offers example applications and project templates. For details, see [Create a TronBox Project](https://tronbox.io/docs/guides/create-a-box).

### Compile

If you want to only compile, run:

```
$ tronbox compile
```

To compile all contracts, use the `--compile-all` option.

To compile an specific set of contracts:

```bash
tronbox compile contracts/your_contract.sol contracts/another_contract.sol ...
```

Specify a network using the `--network` option. Network name must exist in the configuration. For details, see [Compile a Project](https://tronbox.io/docs/guides/compile-contracts).

### Migrate

To deploy our smart contracts, you need to connect to a blockchain. Use the **TronBox Runtime Environment** to create and interact with the blockchain. For details, see [Contract Deployment (Migrations)](https://tronbox.io/docs/guides/deploy-contracts).

To run your migrations, run the following:

```
$ tronbox migrate
```

### Test

To run all tests, run:

```
$ tronbox test
```

Alternatively, you can specify a path to a specific file you want to run: `tronbox test ./path/to/test/file.js`. For details, see [Test Your Contracts](https://tronbox.io/docs/guides/test-contracts).

### Interact with the contract

To interact with the contract, run:

```
$ tronbox console
```

You will see the following prompt:

```
$ tronbox(development)>
```

The name in the parentheses of the prompt `tronbox(development)>` is the network that is currently connected to. For details, see [Interact with a Contract](https://tronbox.io/docs/guides/interact-with-contracts).

# Integrity Check

- The package files will be signed using a GPG key pair, and the correctness of the signature will be verified using the following public key:

```
pub: 82C1 BB84 1BFA FD01 9CA6  1ACB E98F C329 87F3 BF76
uid: dev@tronbox.io
```

## Development

To dive deeper into advanced topics of the TronBox project lifecycle, please see the [Official TronBox Documentation](https://tronbox.io/docs/) for guides, tips, and examples.

To contribute, see [CONTRIUTING.MD](https://github.com/tronprotocol/tronbox/blob/master/CONTRIBUTING.md).
