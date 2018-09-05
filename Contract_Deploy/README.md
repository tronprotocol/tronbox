# Contract deployment and trigger
## contract develop and compile
./contracts should contains all your contracts. 
<br>
```
pragma solidity ^0.4.24;
contract Test{
    function f() returns (string){
        return "method f()";
    }
    function g() returns (string){
        return "method g()";
    }
}
```
<br>
in migrations/2_deploy_contracts.js
<br>

```
var Migrations = artifacts.require("./Migrations.sol");
var Test = artifacts.require("./Test.sol");
module.exports = function(deployer) {
  deployer.deploy(Migrations);
  deployer.deploy(Test);
};
```

## explanation:
<br>
var Test = artifacts.require("./Test.sol"); //declare a new contract instance<br>
deployer.deploy(Test): for deploy Test Contract
<br>

## compile the contract
<br>
tronbox compile<br>
By default, tronbox compilr only compile modified contracts since last compile. to re-compile, use <br>
tronbox compile --compile-all<br>
output in ./build/contracts. auto generated if it doesnt exist such directory
<br>

## contract deployment
<br>
tronbox migrate or<br>
tronbox migrate --reset to re-deploy everything including previous migration and new migration<br>

```
PS  C:\**\bare-box> tronbox migrate --reset  --network production
Using network 'production'.
Running migration: 1_initial_migration.js
  Deploying Migrations...
  Migrations: 41271233ac2eea178ec52f1aea64627630403c67ce
  Deploying Test...
  Test: 41477f693ae6f691daf7d399ee61c32832c0314871
Saving successful migration to network...
Saving artifacts...
```

<br>

## Trigger contract
testing script in ./tests目录。TronBox ignore all other extension except .js，.es，.es6 and .jsx<br>
Example testing script: test.js：<br>
```
var Test = artifacts.require("./Test.sol");
contract('Test', function(accounts) {
	it("call method g", function() {
	    Test.deployed().then(function(instance) {
		  return instance.call('g');
		}).then(function(result) {
		  assert.equal("method g()", result[0], "is not call method g");
	    });
	});
	it("call method f", function() {
	    Test.deployed().then(function(instance) {
		  return instance.call('f');
		}).then(function(result) {
		  assert.equal("method f()", result[0], "is not call method f");
		});
	});
});
```
<br>
running testing script:<br>

```
PS C:\**\bare-box> tronbox test ./test/test.js --network production
Using network 'production'.
  Contract: Test
    √ call method g
    √ call method f
  2 passing (23ms)
```