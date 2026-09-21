// Test fixture config — env-driven so a single fixture can cover compile/migrate/test variants.
//
// Recognized env vars:
//   CONTRACTS_DIR     — switches contracts_directory (default: contracts)
//   MIGRATIONS_DIR    — switches migrations_directory (default: migrations)
//   TEST_DIR          — switches test_directory (default: test)
//   BUILD_DIR         — switches build_directory (default: build)
//   SOLC_VERSION      — pins the Tron Solidity compiler version (default: 0.8.31)
//   SOLC_SETTINGS_JSON — JSON-encoded compilers.solc.settings (default: {})

module.exports = {
  contracts_directory: process.env.CONTRACTS_DIR || 'contracts',
  migrations_directory: process.env.MIGRATIONS_DIR || 'migrations',
  test_directory: process.env.TEST_DIR || 'test',
  build_directory: process.env.BUILD_DIR || 'build',
  networks: {
    mainnet: {
      privateKey: process.env.PRIVATE_KEY_MAINNET,
      userFeePercentage: 100,
      feeLimit: 1000 * 1e6,
      fullHost: 'https://api.trongrid.io',
      network_id: '1'
    },
    shasta: {
      privateKey: process.env.PRIVATE_KEY_SHASTA,
      userFeePercentage: 50,
      feeLimit: 1000 * 1e6,
      fullHost: 'https://api.shasta.trongrid.io',
      network_id: '2'
    },
    nile: {
      mnemonic: process.env.MNEMONIC_NILE,
      userFeePercentage: 100,
      feeLimit: 1000 * 1e6,
      fullHost: 'https://nile.trongrid.io',
      network_id: '3'
    },
    development: {
      privateKey: '0000000000000000000000000000000000000000000000000000000000000001',
      userFeePercentage: 0,
      feeLimit: 1000 * 1e6,
      fullHost: 'http://127.0.0.1:9090',
      network_id: '9'
    }
  },
  compilers: {
    solc: {
      version: process.env.SOLC_VERSION || '0.8.31',
      settings: process.env.SOLC_SETTINGS_JSON ? JSON.parse(process.env.SOLC_SETTINGS_JSON) : {}
    }
  }
};
