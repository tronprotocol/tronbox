# Tron-Box User Guide

### Note: Tron-Box is a fork from Truffle project

## Installation
`$ npm install -g tronbox`
## OS requirement
- NodeJS 5.0+
- Windows, Linux, or Mac OS X

## Features
1. Initialize a Customer Tron-Box Project<br>
`$ tronbox init`
<br>

2. Download a Dapp, ex: metacoin-box<br>
`$ tronbox unbox metacoin`
<br>

3. Contract Compiler<br>
`$ tronbox compile`

<br>
To compile for all contracts, select --compile-all.

Optionally, you can select: <br>
--compile-all: Force compile all contracts. <br>
--network save results to a specific host network<br>
<br>

## 4. Contract Migration<br>
`$ tronbox migrate`
<br>

This command will invoke all migration scripts within the migrations directory. If your previous migration was successful, `tronbox migrate` will invoke a newly created migration. If there is no new migration script, this command will have no operational effect. Instead, you can use the option `--reset` to restart the migration script.<br> 

`$ tronbox migrate --reset` 
<br>
## 5. Start Console<br>
This will use the default network to start a console. It will automatically connect to a TVM client. You can use `--network` to change this. <br>

`$ tronbox console`<br>

The console supports the `tronbox` command. For example, you can invoke `migrate --reset` in the console. The result is the same as invoking `tronbox migrate --reset` in the command. 
<br>

## Extra Features in TronBox console:<br>

1. All the compiled contracts can be used, just like in development & test, front-end code, or during script migration. <br>

2. After each command, your contract will be re-loaded. After invoking the `migrate --reset` command, you can immediately use the new address and binary.<br>

3. Every returned command's promise will automatically be logged. There is no need to use `then()`, which simplifies the command.<br>

## 6. Testing<br>

To carry out the test, run the following command:<br>

`$ tronbox test`<br>

You can also run the test for a specific file：<br>

`$ tronbox test ./path/to/test/file.js`<br>

Testing in TronBox is a bit different than in Truffle.
Let's say we want to test the contract Metacoin (from the Metacoin Box that you can download with `tronbox unbox metacoin`):

```
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
```
var MetaCoin = artifacts.require("./MetaCoin.sol");
contract('MetaCoin', function(accounts) {
  it("should put 10000 MetaCoin in the first account", function() {

    return MetaCoin.deployed().then(function(instance) {
      return instance.call('getBalance',[accounts[0]]);
    }).then(function(balance) {
      assert.equal(balance.toNumber(), 10000, "10000 wasn't in the first account");
    });
  });
  // ...
```
As you can see, in TronBox you execute the method `getBalance` with
```
instance.call('getBalance',[accounts[0]]);
```
while in Truffle you would have called:
```
instance.getBalance.call(accounts[0]);
```
or
```
instance.getBalance(accounts[0]);
```
As a general rule, the Tronbox artifact uses the method `call` to execute the contracts. Also, it expects all the parameters to be passed to the contract in an array. So, the following will throw an error:
```
instance.call('sendCoin', address, amount, {from: account[1]});
```
the correct call is
```
instance.call('sendCoin',[address, amount], {from: account[1]});
```

## How to contribute

1. Fork this repo.

2. Clone your forked repo recursively, to include submodules, for example:
```
git clone --recurse-submodules -j8 git@github.com:sullof/tron-box.git
```
3. If you don't have yarn, install it globally:
```
npm i -g yarn
```
4. Bootstrap the project:
```
yarn bootstrap
```
5. To build TronBox:
```
yarn build:tronbox
```
6. During the development, for better debugging, you can run
```
(cd packages/tronwrap/tron-web && yarn build -d)
chmod +x ./packages/truffle-core/cli.js 
./packages/truffle-core/cli.js migrate --reset
```

