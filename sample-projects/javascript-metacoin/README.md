# MetaCoin TronBox Project

A sample project with MetaCoin and ConvertLib contracts, deployment scripts, and JavaScript contract tests.

## Configuration

Network and compiler settings are defined in `tronbox-config.js`. The default network is `development`.

## Install dependencies

If dependencies were not installed during project initialization, run:

```shell
npm install
```

## Compile

Compile the contracts in `contracts/`:

```shell
tronbox compile
```

Use `--all` to recompile every contract. Artifacts are written to `build/contracts/`.

## Start a local node

Start an in-memory TRON development network with funded accounts:

```shell
tronbox node
```

The node listens at `http://127.0.0.1:9090` by default. Keep it running and use another terminal for the following commands. Alternatively, you can use the [TronBox Runtime Environment (TRE)](https://hub.docker.com/r/tronbox/tre).

## Migrate

Deploy contracts using the scripts in `migrations/`:

```shell
tronbox migrate
```

To deploy to another configured network, use `--network <name>`. For example:

```shell
tronbox migrate --network nile
```

For details, see [Contract Deployment (Migrations)](https://tronbox.io/docs/guides/deploy-contracts).

## Test

Run the MetaCoin contract tests against the local development node:

```shell
tronbox test
```

The tests require at least two funded accounts, provided by `tronbox node` or TRE. To run only the MetaCoin test file, use `tronbox test test/metacoin.js`.

## Console

Open an interactive console with your project's contracts available:

```shell
tronbox console
```

The prompt shows the selected network:

```text
tronbox(development)>
```

## Work with EVM

TronBox supports deploying contracts on EVM-compatible blockchains. For details, see [Work with EVM](https://tronbox.io/docs/guides/work-with-evm).

## Documentation

For more guides and examples, see the [Official TronBox Documentation](https://tronbox.io/docs/).
