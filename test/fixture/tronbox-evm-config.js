// EVM-side test fixture config. Same env-driven pattern as tronbox-config.js.

module.exports = {
  contracts_directory: process.env.CONTRACTS_DIR || 'contracts',
  migrations_directory: process.env.MIGRATIONS_DIR || 'migrations',
  test_directory: process.env.TEST_DIR || 'test',
  build_directory: process.env.BUILD_DIR || 'build',
  networks: {
    bttc: {
      privateKey: process.env.PRIVATE_KEY_BTTC,
      fullHost: 'https://rpc.bt.io',
      network_id: '1'
    },
    donau: {
      privateKey: process.env.PRIVATE_KEY_DONAU,
      fullHost: 'https://pre-rpc.bt.io',
      network_id: '2'
    },
    development: {
      privateKey: process.env.PRIVATE_KEY_DEV,
      fullHost: 'http://127.0.0.1:8545',
      network_id: '9'
    }
  },
  compilers: {
    solc: {
      version: process.env.SOLC_VERSION || '0.8.31',
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
        evmVersion: 'paris',
        viaIR: true
      }
    }
  }
};
