**4.6.0**

### Features

- Enhanced `flatten` command
  - Unified SPDX license header generation across all input files
  - Unified `pragma abicoder` handling and normalization
  - Added dependency library version information in build output

### Breaking Changes

- **BREAKING CHANGE**: Removed EPM (Ethereum Package Manager) support
- **BREAKING CHANGE**: Configuration directory paths (`build_directory`, `contracts_directory`, `contracts_build_directory`, `migrations_directory`, `test_directory`) are now constrained to the project root
- **BREAKING CHANGE**: Disallowed running and importing files outside the project directory
- **BREAKING CHANGE**: Removed global config injection

### Bug Fixes & Improvements

- Added checksum validation for downloaded soljson compiler files
- Improved error capturing and unhandled promise rejection handling
- Normalized error output formatting and added explicit exit codes
- Enhanced runtime stability with null-safety checks on deployment and contract interactions

### Dependencies

- Upgraded `tronweb` from 6.1.1 to 6.2.2
- Upgraded `axios` from 1.12.0 to 1.13.6
- Upgraded `glob` to 13.0.6
- Upgraded `ajv` to 6.14.0
- Upgraded `yauzl` to 3.2.1

**4.5.0**

### Major Refactoring

- **BREAKING CHANGE**: Migrated from `web3` v4 to `ethers` v6 for EVM mode
  - Migration scripts, test scripts, and TronBox console now use `ethers` instead of `web3`

### Features

- Made Migrations contract optional - projects can now run migrations without requiring `Migrations.sol`

### Dependencies

- Upgraded `tronweb` from 6.0.0 to 6.1.1
- Upgraded `mocha` from 10.2.0 to 11.7.4
- Upgraded `eslint` from 9.31.0 to 9.39.1
- Upgraded `eslint-plugin-n` from 17.15.1 to 17.23.1
- Upgraded `axios` from 1.11.0 to 1.12.0
- Upgraded `lodash` from 4.17.21 to 4.17.23
- Upgraded `@solidity-parser/parser` from 0.16.0 to 0.20.2
- Upgraded Babel toolchain from 7.25.9 to 7.28.3
- Pinned all dependencies to exact versions for reproducible builds
- Raised minimum supported Node.js version to 20

### Removals

- Removed `@truffle/contract-sources` dependency (inlined contract discovery logic)
- Removed `@truffle/error` dependency (replaced with custom TronBoxError class)
- Removed `@truffle/expect` dependency (replaced with local utility)
- Removed `truffle-blockchain-utils` dependency (unused)
- Removed `cpr` dependency (replaced with native `fs.promises` implementation)
- Removed `temp` dependency (replaced with `tmp` package)
- Removed `web3` v4.16.0 dependency (replaced with `ethers` v6.15.0)

### Bug Fixes & Improvements

- Fixed config property path resolution to handle relative paths correctly
- Improved error messages and command-line output wording

### Documentation

- Updated comments throughout codebase to reflect `ethers` migration

**4.4.0**

- Added support for Tron Solidity compiler `0.8.25`
- Removed the `build`, `serve`, and `watch` CLI commands
- Added a dedicated `help` command with clear usage information for each subcommand and parameter
- Refactored core commands (`compile`, `console`, `migrate`, `test`, etc.) to include descriptions, parameter documentation, usage examples, and enhanced logging and error handling
- Ran each REPL subcommand in its own child process and streamed stdout/stderr as received
- Updated documentation links to https://tronbox.io/docs

**4.3.0**

- Add MetaCoin project template for tronbox init
- Support calling overloaded Solidity functions
- Make tronWeb instance available in migration scripts

**4.2.2**

- Upgrade `axios` to v1.11.0 to resolve `form-data` vulnerability
- Replace `request`/`superagent` with `axios`
- Remove `@resolver-engine/imports-fs`, replaced with custom implementation
- Replace `github-download` with inline implementation
  - Replace deprecated `request` with `axios` for HTTP requests
  - Replace `adm-zip` with `yauzl` for ZIP file handling

**4.2.1**

- Support for Tron Solidity compiler 0.8.24
- Upgrade eslint to v9.31.0

**4.2.0**

- Developed a command-line interface (CLI) for the `init` command
- Resolve compatibility issue with passing array parameters in method calls

**4.1.1**

- Support for Solidity compiler 0.8.23
- Bump axios version to v1.8.3

**4.1.0**

- Bump tronweb version to v6.0.0
- Bump web3 version to v4.16.0
- Bump eslint version to v9.17.0

**4.0.2**

- Support for Solidity compiler 0.8.22

**4.0.1**

- Support for IR-based codegen
- Support for Solidity compiler 0.8.21
- Bump axios version to v1.7.7

**4.0.0**

- Support deploying smart contracts to the EVM chain

**3.4.4**

- Dropping support for Node.js v16
  As part of this release, we are dropping support for Node.js v16. This version of Node.js reached its end-of-life in September of last year.
- Optimize the configuration file structure

**3.4.3**

- Improve `tronbox compile` output
- Upgrade some dependency packages
- Remove some unnecessary dependency packages

**3.4.2**

- Add support for Solidity compiler 0.8.20
- Add `debug_traceTransaction` && `debug_storageRangeAt` function to debug environment for supporting [tronbox/tre](https://hub.docker.com/r/tronbox/tre) docker image.

`debug_traceTransaction`:

```javascript
const txid = 'f6b72dda65682b858c1c1980710aad7955fbf6db91c66840da0f852fc3cc694b';
const result = await tronWrap.send('debug_traceTransaction', [txid]);
console.log(result);
```

`debug_storageRangeAt`:

```javascript
const result = await tronWrap.send('debug_storageRangeAt', [0, 0, contractAddress, '0x01', 1]);
console.log(result);
```

**3.4.1**

- Add support for Solidity compiler 0.8.21
- Bump tronweb from 5.1.0 to 5.3.0

**3.4.0**

- Add support for `console.log` in Solidity smart contracts

```solidity
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
import "tronbox/console.sol";

contract SampleContract {
    constructor() {
        console.log("SampleContrac::constructor");
    }
}
```

**3.3.0**

- Add support for contract flattening

**3.2.0**

- Add support for `deployProxy`, `deployBeacon` and `deployBeaconProxy` of `@openzeppelin/truffle-upgrades` in migrations

```javascript
const { deployProxy } = require('@openzeppelin/truffle-upgrades');
const Box = artifacts.require('TransparentBox');

module.exports = async function (deployer) {
  try {
    // Setup tronbox deployer
    deployer.trufflePlugin = true;
    const instance = await deployProxy(Box, [42], { deployer });
    console.info('Deployed', instance.address);
  } catch (error) {
    console.error('Transparent: deploy box error', error);
  }
};
```

**3.1.2**

- Add support for Solidity compiler 0.8.18

**3.1.1**

- Add support for Solidity compiler 0.8.17

**3.1.0**

- Bump chokidar from 1.7.0 to 3.5.3
- Bump yargs from 8.0.2 to 15.4.1
- Bump tronweb from 4.4.0 to 5.1.0

**3.0.2**

- Add support for ABIEncoderV2
- Add support for using mnemonic in network config
- Add support for converting a truffle project to tronbox project when `init`
- Bump tronweb from 4.3.0 to 4.4.0

**3.0.1**

- Bug fixed and internal improvements

**3.0.0**

- Bump tronweb from 4.0.1 to 4.3.0
- Add support for Solidity compiler 0.8.7 and 0.8.11
- Add `tronWrap.send` function to test environment for supporting [tronbox/tre](https://hub.docker.com/r/tronbox/tre) docker image.
- Add `tre_setAccountBalance` RPC method. The method can set the given account's balance to the specified SUN value.
- Add `tre_setAccountCode` RPC method. The method can set the given account's code to the specified value.
- Add `tre_setAccountStorageAt` RPC method. The method can set the given account's storage slot to the specified data.
- Add `tre_blockTime` RPC method. The method can set the blockTime in seconds for automatic mining. A blockTime of 0 enables "instamine mode", where new executable transactions will be mined instantly.
- Add `tre_mine` RPC method. The method can mine exactly `blocks` number of blocks.
- Add `tre_unlockedAccounts` RPC method. The method can set up any arbitrary account to impersonate during development.

`tre_setAccountBalance`:

```javascript
const address = 'TNPeeaaFB7K9cmo4uQpcU32zGK8G1NYqeL';
const balance = '0x3e8';
const result = await tronWrap.send('tre_setAccountBalance', [address, balance]);
console.log(result);
```

`tre_setAccountCode`:

```javascript
const address = 'TNPeeaaFB7K9cmo4uQpcU32zGK8G1NYqeL';
const data = '0xbaddad42';
const result = await tronWrap.send('tre_setAccountCode', [address, data]);
console.log(result);
```

`tre_setAccountStorageAt`:

```javascript
const address = 'TNPeeaaFB7K9cmo4uQpcU32zGK8G1NYqeL';
const slot = '0x0000000000000000000000000000000000000000000000000000000000000005';
const data = '0xbaddad42';
const result = await tronWrap.send('tre_setAccountStorageAt', [address, slot, data]);
console.log(result);
```

`tre_blockTime`:

```javascript
const result = await tronWrap.send('tre_blockTime', [3]);
console.log(result);
```

`tre_mine`:

```javascript
const result = await tronWrap.send('tre_mine', [{ blocks: 5 }]);
console.log(result);
```

`tre_unlockedAccounts`:

```javascript
const result = await tronWrap.send('tre_unlockedAccounts', [['TNPeeaaFB7K9cmo4uQpcU32zGK8G1NYqeL']]);
console.log(result);
```

**2.7.25**

- Bump tronweb from 4.0.0 to 4.0.1

**2.7.24**

- Add support for Solidity compiler 0.5.18, 0.6.13, 0.7.7 and 0.8.6

**2.7.23**

- Add support for Solidity compiler 0.8.0

**2.7.22**

- Add support for Solidity compiler 0.7.6

**2.7.21**

- Add support for Solidity compiler 0.7.0

**2.7.20**

- Merge Dependabot pull requests

**2.7.19**

- Add support for Solidity compiler 0.5.16, 0.5.17, 0.6.2, 0.6.8 and 0.6.12

**2.7.18**

- Add support for Solidity compiler 0.6.0
- Bump solc-js from 0.5.9 to 0.8.0

**2.7.17**

- Add support for Solidity compiler 0.5.15 and add signature for tronbox

**2.7.14**

- Add support for Solidity compiler 0.5.12 and 0.5.13 and 0.5.14

**2.7.11**

- Add support for Solidity compiler 0.5.10

**2.7.10**

- Fix for no module '.' found issue

**2.7.8**

- Update to Tronweb 2.1.0, which allows to deploy contract requiring arrays of addresses

**2.7.7**

- Fix Babel bug involving generators

**2.7.5**

- More refactoring
- Show alert if compilers cannot be downloaded

**2.7.4**

- Partial refactoring
- Add support for Solidity compiler 0.5.9

**2.5.2**

- Fix bug in compiler wrapper calls

**2.5.0**

- Add support for JavaTron 3.6 and Solidity compiler for `^0.5.4`
- Fix vulnerability with (unused) `web3` and `diff` packages

**2.3.16**

- Updates TronWeb to version 2.3.2

**2.3.16**

- Updates TronWeb to version 2.3.2

**2.3.15**

- Updates TronWeb to latest version which fixes issues with watch

**2.3.1**

- Adds temporary logo.
- Fix contract name during deployment

**2.3.0**

- When a smart contract deploy fails, the error shows the url to get info about the failed transaction.

**2.2.3**

- Resolve appended process after migrating.
- Add better error messaging.
- Fix issue with invalid origin_energy_limit.

**2.2.2**

- Add parameter configuration by smart contract.

**2.2.1**

- Add compatibility with JavaTron 3.2.

---

For more historic data, check the original repo at
[https://github.com/tronprotocol/tronbox](https://github.com/tronprotocol/tronbox)
