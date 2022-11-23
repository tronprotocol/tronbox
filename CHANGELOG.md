__3.1.0__
* Bump chokidar from 1.7.0 to 3.5.3
* Bump yargs from 8.0.2 to 15.4.1

__3.0.1__
* Bug fixed and internal improvements

__3.0.0__
* Bump tronweb from 4.0.1 to 4.3.0
* Add support for Solidity compiler 0.8.7 and 0.8.11
* Add `tronWrap.send` function to test environment for supporting [tronbox/tre](https://hub.docker.com/r/tronbox/tre) docker image.
* Add `tre_setAccountBalance` RPC method. The method can set the given account's balance to the specified SUN value.
* Add `tre_setAccountCode` RPC method. The method can set the given account's code to the specified value.
* Add `tre_setAccountStorageAt` RPC method. The method can set the given account's storage slot to the specified data.
* Add `tre_blockTime` RPC method. The method can set the blockTime in seconds for automatic mining. A blockTime of 0 enables "instamine mode", where new executable transactions will be mined instantly.
* Add `tre_mine` RPC method. The method can mine exactly `blocks` number of blocks.
* Add `tre_unlockedAccounts` RPC method. The method can set up any arbitrary account to impersonate during development.

`tre_setAccountBalance`:
```js
const address = "TNPeeaaFB7K9cmo4uQpcU32zGK8G1NYqeL";
const balance = "0x3e8";
const result = await tronWrap.send("tre_setAccountBalance", [address, balance]);
console.log(result);
```
`tre_setAccountCode`:
```js
const address = "TNPeeaaFB7K9cmo4uQpcU32zGK8G1NYqeL";
const data = "0xbaddad42";
const result = await tronWrap.send("tre_setAccountCode", [address, data]);
console.log(result);
```
`tre_setAccountStorageAt`:
```js
const address = "TNPeeaaFB7K9cmo4uQpcU32zGK8G1NYqeL";
const slot = "0x0000000000000000000000000000000000000000000000000000000000000005";
const data = "0xbaddad42";
const result = await tronWrap.send("tre_setAccountStorageAt", [address, slot, data]);
console.log(result);
```
`tre_blockTime`:
```js
const result = await tronWrap.send("tre_blockTime", [3]);
console.log(result);
```
`tre_mine`:
```js
const result = await tronWrap.send("tre_mine", [{ blocks: 5}]);
console.log(result);
```
`tre_unlockedAccounts`:
```js
const result = await tronWrap.send("tre_unlockedAccounts", [["TNPeeaaFB7K9cmo4uQpcU32zGK8G1NYqeL"]]);
console.log(result);
```

__2.7.25__
* Bump tronweb from 4.0.0 to 4.0.1

__2.7.24__
* Add support for Solidity compiler 0.5.18, 0.6.13, 0.7.7 and 0.8.6

__2.7.23__
* Add support for Solidity compiler 0.8.0

__2.7.22__
* Add support for Solidity compiler 0.7.6

__2.7.21__
* Add support for Solidity compiler 0.7.0

__2.7.20__
* Merge Dependabot pull requests

__2.7.19__
* Add support for Solidity compiler 0.5.16, 0.5.17, 0.6.2, 0.6.8 and 0.6.12

__2.7.18__
* Add support for Solidity compiler 0.6.0
* Bump solc-js from 0.5.9 to 0.8.0

__2.7.17__
* Add support for Solidity compiler 0.5.15 and add signature for tronbox

__2.7.14__
* Add support for Solidity compiler 0.5.12 and 0.5.13 and 0.5.14

__2.7.11__
* Add support for Solidity compiler 0.5.10

__2.7.10__
* Fix for no module '.' found issue

__2.7.8__
* Update to Tronweb 2.1.0, which allows to deploy contract requiring arrays of addresses

__2.7.7__
* Fix Babel bug involving generators

__2.7.5__
* More refactoring
* Show alert if compilers cannot be downloaded

__2.7.4__
* Partial refactoring
* Add support for Solidity compiler 0.5.9

__2.5.2__
* Fix bug in compiler wrapper calls

__2.5.0__
* Add support for JavaTron 3.6 and Solidity compiler for `^0.5.4`
* Fix vulnerability with (unused) `web3` and `diff` packages

__2.3.16__
* Updates TronWeb to version 2.3.2

__2.3.16__
* Updates TronWeb to version 2.3.2

__2.3.15__
* Updates TronWeb to latest version which fixes issues with watch

__2.3.1__
* Adds temporary logo.
* Fix contract name during deployment

__2.3.0__
* When a smart contract deploy fails, the error shows the url to get info about the failed transaction.

__2.2.3__
* Resolve appended process after migrating.
* Add better error messaging.
* Fix issue with invalid origin_energy_limit.

__2.2.2__
* Add parameter configuration by smart contract.

__2.2.1__
* Add compatibility with JavaTron 3.2.


-----

For more historic data, check the original repo at
[https://github.com/tronprotocol/tronbox](https://github.com/tronprotocol/tronbox)
