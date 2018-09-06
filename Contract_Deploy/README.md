# Contract Development, Deployment, and Trigger
## Contract Development 

The `./contracts` directory contains all your contracts. By default, there is a contract file and a library file within the .sol extension. Even though the library file has some unique properties, for simplicity purposes, it will be referred to as a contract.<br>

Tronbox requires the contract name and file name to be defined the same. For example, if the file name is `Test.sol`, we can write the contract as follows:<br>
<br>

```
pragma solidity ^0.4.4;
contract Test{
    function f() returns (string){
        return "method f()";
    }
    function g() returns (string){
        return "method g()";
    }
}
```
This type of contract is case-sensitive. In other words, if a capitalized letter is used for every beginning, then  

Increase Deploy Configuration
<br>
Configuring migrations/2_deploy_contracts.js as follows:
<br>

```
var Migrations = artifacts.require("./Migrations.sol");
var Test = artifacts.require("./Test.sol");
module.exports = function(deployer) {
  deployer.deploy(Migrations);
  deployer.deploy(Test);
};
```
The above code primarily has two extra lines. One line is `var Test = artifacts.require("./Test.sol")`; declare a new contract instance as `Test`; This increases a new line `deployer.deploy(Test)`    


## explanation:
<br>

: for deploy Test Contract
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
