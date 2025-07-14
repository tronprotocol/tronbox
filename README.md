<p align="center">
  <a href="https://tronbox.io/" title="TronBox Website">
    <img alt="TronBox" src="https://raw.githubusercontent.com/tronprotocol/tronbox/master/assets/TronBox-logo.png" width="160"/>
  </a>
</p>

# TronBox

TronBox is a tool for developing, testing, and deploying smart contracts. It is designed for blockchains using the TRON Virtual Machine (TVM).

- Built-in smart contract compilation, linking, deployment, and binary management.
- External script runner that executes scripts within a TronBox environment.
- Interactive console for direct contract communication.
- Automated contract testing for rapid development.
- Scriptable, extensible deployment & migrations framework.
- Network management for deploying to any number of public & private networks.

TronBox is a fork of [Truffle](https://www.trufflesuite.com/truffle).

## Quick Start

### Install

Before you can use TronBox, install it using the npm command. For details, see [Install TronBox](https://developers.tron.network/reference/install).

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

`tronbox.js`: TronBox configuration file

For those getting started, you can use TronBox Boxes, which offers example applications and project templates. For details, see [Create a TronBox Project](https://developers.tron.network/reference/create-a-tronbox-project).

### Compile

If you want to only compile, run:

```
$ tronbox compile
```

To compile all contracts, use the `--compile-all` option.

Specify a network using the `--network` option. Network name must exist in the configuration. For details, see [Compile a Project](https://developers.tron.network/reference/compile-a-contract).

### Migrate

To deploy our smart contracts, you need to connect to a blockchain. Use the **TronBox Runtime Environment** to create and interact with the blockchain. For details, see [Contract Deployment (Migrations)](https://developers.tron.network/reference/contract-deploymentmigrations).

To run your migrations, run the following:

```
$ tronbox migrate
```

### Test

To run all tests, run:

```
$ tronbox test
```

Alternatively, you can specify a path to a specific file you want to run: `tronbox test ./path/to/test/file.js`. For details, see [Test Your Contracts](https://developers.tron.network/reference/test-your-contracts).

### Interact with the contract

To interact with the contract, run:

```
$ tronbox console
```

You will see the following prompt:

```
$ tronbox(development)>
```

The name in the parentheses of the prompt `tronbox(development)>` is the network that is currently connected to. For details, see [Interact with a Contract](https://developers.tron.network/reference/interact-with-a-contract).

# Integrity Check

- The package files will be signed using a GPG key pair, and the correctness of the signature will be verified using the following public key:

```
pub: 82C1 BB84 1BFA FD01 9CA6  1ACB E98F C329 87F3 BF76
uid: dev@tronbox.io
```

## Development

To dive deeper into advanced topics of the TronBox project lifecycle, please see the [Official TronBox Documentation](https://developers.tron.network/reference/what-is-tronbox) for guides, tips, and examples.

To contribute, see [CONTRIUTING.MD](https://github.com/tronprotocol/tronbox/blob/master/CONTRIBUTING.md).
