# Table of Contents
- [OS Requirement](https://github.com/jz2120100058/tronbox/blob/master/FURTHER_INFO.md#os-requirement)
- [Verifying the PGP signature](https://github.com/jz2120100058/tronbox/blob/master/FURTHER_INFO.md#verifying-the-pgp-signature)
- [Configuration](https://github.com/jz2120100058/tronbox/blob/master/FURTHER_INFO.md#configuration)
  - [Configure Solc](https://github.com/jz2120100058/tronbox/blob/master/FURTHER_INFO.md#configure-solc)
- [Tron Solidity versions supported by TronBox](https://github.com/jz2120100058/tronbox/blob/master/FURTHER_INFO.md#tron-solidity-versions-supported-by-tronbox)
- [Contract Migration](https://github.com/jz2120100058/tronbox/blob/master/FURTHER_INFO.md#contract-migration)
- [TronBox Console](https://github.com/jz2120100058/tronbox/blob/master/FURTHER_INFO.md#tronbox-console)
  - [Start Console](https://github.com/jz2120100058/tronbox/blob/master/FURTHER_INFO.md#start-console)
  - [Extra Features in TronBox console](https://github.com/jz2120100058/tronbox/blob/master/FURTHER_INFO.md#start-console)
- [Testing](https://github.com/jz2120100058/tronbox/blob/master/FURTHER_INFO.md#testing)


---

## OS requirement
```
NodeJS >=8
Windows, Linux or Mac OS X
Docker Engine >=v17
```

## Verifying the PGP signature

Follow these steps to verify the PGP signature:
1. Install the npm [pkgsign](https://www.npmjs.com/package/pkgsign#installation).

2. Get the version of tronbox dist.tarball

```shell
$ npm view tronbox dist.tarball
https://registry.npmjs.org/tronbox/-/tronbox-2.7.25.tgz
```
3. Get the tarball

```shell
wget https://registry.npmjs.org/tronbox/-/tronbox-2.7.25.tgz
```

4. Verify the tarball

```shell
$ pkgsign verify tronbox-2.7.25.tgz --package-name tronbox
extracting unsigned tarball...
building file list...
verifying package...
package is trusted
```
You can find the signature public key [here](https://keybase.io/tronbox/pgp_keys.asc).


## Configuration
To use TronBox for your dApp, a file named `tronbox.js` should exist in the source root. This file tells TronBox how to connect to nodes and event server and passes parameters (such as the default private key). 

Here is an example of `tronbox.js`:
```javascript
module.exports = {
  networks: {
    development: {
      privateKey: 'your private key',
      userFeePercentage: 100, // The percentage of resource consumption ratio.
      feeLimit: 100000000, // The TRX consumption limit for the deployment and trigger, unit is SUN
      fullNode: 'https://api.nileex.io',
      solidityNode: 'https://api.nileex.io',
      eventServer: 'https://event.nileex.io',
      network_id: '*'
    }，
    compilers: {
      solc: {
        version: '0.8.0'
      }
    }
  },
   // solc compiler optimize
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    },
    evmVersion: 'istanbul'
  }
};
```
Notice that the example above uses TronBox Runtime Environment >= 1.0.0, which exposes a mononode on port 9090.

### Configure Solc

Refer to this example for how to configure the solc compiler in tronbox.js:
```javascript
module.exports = {
  networks: {
    compilers: {
      solc: {
        version: '0.8.6'
      }
    }
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    },
    evmVersion: 'istanbul'
  }
};

```

## Tron Solidity Versions supported by TronBox

```
0.4.24
0.4.25
0.5.4
0.5.8
0.5.9
0.5.10
0.5.12
0.5.13
0.5.14
0.5.15
0.5.16
0.5.17
0.5.18
0.6.0
0.6.2
0.6.8
0.6.12
0.6.13
0.7.0
0.7.6
0.7.7
0.8.0
0.8.6
0.8.7
0.8.11
```

For more versions details: https://github.com/tronprotocol/solidity/releases


## Contract Migration

```
tronbox migrate
```

This command will invoke all migration scripts within the migrations directory. If your previous migration was successful, `tronbox migrate` will invoke a newly-created migration. If there is no new migration script, this command will have no operational effect. Instead, you can use the option `--reset` to restart the migration script.

```
tronbox migrate --reset
```


## TronBox Console

### Start Console<br>
This will use the default network to start a console. It will automatically connect to a TVM client. You can change networks using the `--network` option.

```
tronbox console
```

The console supports the `tronbox` command. For example, you can invoke `migrate --reset` in the console. The result is the same as invoking `tronbox migrate --reset` in the command.
<br>

### Extra Features in TronBox console:<br>

1. All the compiled contracts can be used, just like in development & test, front-end code, or during script migration. <br>

2. After each command, your contract will be re-loaded. After invoking the `migrate --reset` command, you can immediately use the new address and binary.<br>

3. Every returned command's promise will automatically be logged. There is no need to use `then()`, which simplifies the command.<br>

## Testing<br>

To carry out the test, run the following command:

```
tronbox test
```

You can also run the test for a specific file：

```
tronbox test ./path/to/test/file.js
```

Testing in TronBox is a bit different than in Truffle.
Let's say we want to test the contract Metacoin (from the Metacoin Box that you can download with `tronbox unbox metacoin`):

```solidity
contract MetaCoin {
	mapping (address => uint) balances;

	event Transfer(address _from, address _to, uint256 _value);
	event Log(string s);

	constructor() public {
		balances[tx.origin] = 10000;
	}

	function sendCoin(address receiver, uint amount) public returns(bool sufficient) {
		if (balances[msg.sender] < amount) return false;
		balances[msg.sender] -= amount;
		balances[receiver] += amount;
		emit Transfer(msg.sender, receiver, amount);
		return true;
	}

	function getBalanceInEth(address addr) public view returns(uint){
		return ConvertLib.convert(getBalance(addr),2);
	}

	function getBalance(address addr) public view returns(uint) {
		return balances[addr];
	}
}
```

Now, take a look at the first test in `test/metacoin.js`:
```javascript
const MetaCoin = artifacts.require('MetaCoin');

contract('MetaCoin', accounts => {
  it('should put 10000 MetaCoin in the first account', () =>
    MetaCoin.deployed()
      .then(instance => instance.getBalance.call(accounts[0]))
      .then(balance => {
        assert.equal(balance.valueOf(), 10000, "10000 wasn't in the first account");
      }));
  // ...
```
Starting from version 2.0.5, in TronBox artifacts () the following commands are equivalent:
```javascript
instance.call('getBalance', accounts[0]);
instance.getBalance(accounts[0]);
instance.getBalance.call(accounts[0]);
```
and you can pass the `address` and `amount` for the method in both the following ways:
```javascript
instance.sendCoin(address, amount, {from: account[1]});
```
and
```javascript
instance.sendCoin([address, amount], {from: account[1]});
```
