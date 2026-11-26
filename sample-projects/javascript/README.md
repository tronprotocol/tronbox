# Sample TronBox Project

A minimal project with a migration contract and a placeholder deployment script. Add your contracts to `contracts/`, deployment scripts to `migrations/`, and JavaScript tests to `test/`.

## Configuration

Network and compiler settings are defined in `tronbox-config.js`. The default network is `development`.

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

Run your project's contract tests:

```shell
tronbox test
```

To run a single test file, pass its path to `tronbox test`.

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
