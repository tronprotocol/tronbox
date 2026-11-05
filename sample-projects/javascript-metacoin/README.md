# MetaCoin TronBox Project

This is a MetaCoin TronBox project.

## Configuration

Your configuration file is called `tronbox-config.js` and is located at the root of your project directory.

## Compiling

To compile your contracts, use the following command:

```shell
tronbox compile
```

## Migration

The project comes pre-configured with four separate networks:

- Mainnet (https://api.trongrid.io)
- Shasta Testnet (https://api.shasta.trongrid.io)
- Nile Testnet (https://nile.trongrid.io).
- Localnet (http://127.0.0.1:9090)

### Mainnet

To deploy your contracts to Mainnet, you can run the following:

```shell
tronbox migrate --network mainnet
```

### Shasta Testnet

Obtain test coin at https://shasta.tronex.io/

To deploy your contracts to Shasta Testnet, you can run the following:

```shell
tronbox migrate --network shasta
```

### Nile Testnet

Obtain test coin at https://nileex.io/join/getJoinPage

To deploy your contracts to Nile Testnet, you can run the following:

```shell
tronbox migrate --network nile
```

### Localnet

For local development and testing, start a private TRON network using either TronBox Runtime Environment (TRE) or TVMJS client.

#### TronBox Runtime Environment (TRE)

TRE provides a Docker-based private TRON network. Get the image and startup instructions at https://hub.docker.com/r/tronbox/tre.

#### TVMJS client

[`@tvmjs/client`](https://www.npmjs.com/package/@tvmjs/client) provides a TRE-compatible local TRON development node. With Node.js 20 or later installed, install the client and start it:

```shell
npm install --global @tvmjs/client
tvmjs
```

Both options serve the local network at `http://127.0.0.1:9090` and work with the project's `development` configuration.

To deploy your contracts to Localnet, keep the node running and run the following in another terminal:

```shell
tronbox migrate
```

## Testing

To test your contracts, you can run the following:

```shell
tronbox test --network <mainnet|shasta|nile|development>
```

## Work with EVM

TronBox supports deploying contracts on EVM-compatible blockchains.

For more information, please refer to: https://tronbox.io/docs/guides/work-with-evm

## Additional Resources

For further learning, visit the official TronBox site at https://tronbox.io
