合约编写、部署、及调用
合约编写
所有你的合约应该位于./contracts目录。默认我们提供了一个合约文件，一个库文件，均以.sol结尾作为示例。尽管库文件有一定的特殊性，但为简单起见，当前均称之为合约。
Tronbox需要定义的合约名称和文件名准确匹配。举例来说，如果新建一个合约，文件名为Test.sol,则可编写如下案例：
pragma solidity ^0.4.4;
contract Test{
    function f() returns (string){
        return "method f()";
    }
    function g() returns (string){
        return "method g()";
    }
}
这种匹配是区分大小写的，也就是说大小写也要一致。推荐大写每一个开头字母，如上述代码定义。
增加deploy配置
修改migrations/2_deploy_contracts.js为如下：
var Migrations = artifacts.require("./Migrations.sol");
var Test = artifacts.require("./Test.sol");
module.exports = function(deployer) {
  deployer.deploy(Migrations);
  deployer.deploy(Test);
};
上述代码主要增加两行，一行为var Test = artifacts.require("./Test.sol");声明一个新的合约文件实例并命名为Test；增加的另一行内容deployer.deploy(Test);用于将Test进行部署。

合约编译
要编译您的合约，使用：
tronbox compile
tronbox 仅默认编译自上次编译后被修改过的文件，来减少不必要的编译。如果你想编译全部文件，可以使用--compile-all选项。
tronbox compile --compile-all
编译的输出位于./build/contracts目录。如果目录不存在会自动创建。

合约部署
移植是由一些Javascript文件组成来协助发布到以太坊网络。主要目的是用来缓存你的发布任务，它的存在基于你的发布需求会改变的前提。当你的工程发生了重要的改变，你将创建新的移植脚本来将这些变化带到区块链上。之前运行移植的历史记录通过一个特殊的Migrations合约来记录到链上，下面有详细说明。
执行移植，使用下述命令：
tronbox migrate
这个命令会执行所有的位于migrations目录内的移植脚本。如果你之前的移植是成功执行的。tronbox migrate仅会执行新创建的移植。如果没有新的移植脚本，这个命令不同执行任何操作。可以使用选项--reset来从头执行移植脚本。

PS  C:\**\bare-box> tronbox migrate --reset  --network production
Using network 'production'.
Running migration: 1_initial_migration.js
  Deploying Migrations...
  Migrations: 41271233ac2eea178ec52f1aea64627630403c67ce
  Deploying Test...
  Test: 41477f693ae6f691daf7d399ee61c32832c0314871
Saving successful migration to network...
Saving artifacts...

调用
测试文件应置于./tests目录。Truffle只会运行以.js，.es，.es6和.jsx结尾的测试文件，其它的都会被忽略。
新建测试脚本test.js，内容如下：
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

运行测试脚本：

PS C:\**\bare-box> tronbox test ./test/test.js --network production
Using network 'production'.
  Contract: Test
    √ call method g
    √ call method f
  2 passing (23ms)