附录2
基于tronbox的Dapp开发实例
本附录主要介绍基于tronbox的Dapp有前端交互的开发教程，下面是具体的步骤分解。

创建项目并初始化
创建项目
$ mkdir Dapp-demo
初始化Dapp，执行以下命令，得到【图-初始化成功项目目录】
$ cd Dapp-demo
$ tronbox init
图-初始化成功项目目录
备注：
contracts：用于放置合约；
migrate：用于存放移植合约的脚本；
test：用于存放编写的测试脚本
tronbox,js：存放的是网络配置相关的信息，会在下一节【配置网络信息】重点讲解
配置网络信息
网络配置一般分为开发环境（devlopment）及 线上正式环境（production），当然还可以添加其他的测试网络环境。以下是tronbox默认的网络配置信息。

介绍网络配置下的每个参数的含义：
from：合约部署的主账户地址 （base58）
privateKey:  合约部署主账户对应的私钥
cosume_user_resource_percent：部署所需参数，可使用默认设置
fee_limit：部署所需参数，可使用默认设置
host：合约部署目的地IP地址【该IP需要启动FullNode节点服务】
port： 合约部署目的地IP地址API对应的端口【FullNode节点API服务对应的端口号】
eventServer：合约部署目的地事件监听服务的网址【需要和API服务器在同一IP，不然无法监听到事件回调，例：API服务地址为http://127.0.0.1:8090，那么事件监听服务地址则为http://127.0.0.1:****】
network_id：可使用默认设置“*”

然后在项目当前目录手动创建package.json，如下，稍后执行npm install： 
{
 "name": "test-dapp",
  "version": "1.0.0",
  "description": "this is a test dapp",
  "main": "tronbox.js",
  "directories": {
    "test": "test"
  },
  "scripts": {
    "dev": "lite-server",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "alinger",
  "license": "ISC",
  "devDependencies": {
    "lite-server": "^2.3.0"
  }
}

创建前端资源文件目录【src】，资源文件目录列表例如下：

手动在根目录创建资源依赖文件配置bs-config.json
{   "server": {     "baseDir": ["./src", "./build/contracts"]   } }
编写前端代码
注：所需的tronweb需要从https://github.com/tronprotocol/tron-web 下载并打包成tronweb.js ，相关的API也请参考tronweb官方【具体代码见附】

运行
执行命令<npm run dev>启动服务


如下是代码的附录
附: index.html
<!DOCTYPE html> <html lang="en">   <head>     <meta charset="utf-8">     <meta http-equiv="X-UA-Compatible" content="IE=edge">     <meta name="viewport" content="width=device-width, initial-scale=1">     <title>DappDemo</title>   </head>   <body>     <div class="container">       <div class="row">         <div class="col-xs-12 col-sm-8 col-sm-push-2">           <h1 class="text-center">DappDemo</h1>           <hr/>           <br/>         </div>       </div>        <div class="row">         <button class="callBtn" method="f" disabled="disabled">call method f()</button>         <button class="callBtn" method="g" disabled="disabled">call method g()</button>       </div>     </div>      <!-- jQuery (necessary for Bootstrap's JavaScript plugins) -->     <script src="js/jquery-2.1.4.min.js"></script>     <!-- Include all compiled plugins (below), or include individual files as needed -->     <script src="js/bootstrap.min.js"></script>     <script src="js/tronweb.js"></script>     <script src="js/app.js"></script>   </body> </html>

附：App.js
App = {     tronWebProvider: null,     contracts: {},     tronWeb: null,     account: "TPL66VK2gCXNCD7EJg9pgJRfqcRazjhUZY",     privateKey: "da146374a75310b9666e834ee4ad0866d6f4035967bfc76217c5a495fff9f0d0",     contractAddress: null,     init: function () {         this.initData();         this.bindEvents();     },     initData: function () {         this.initTronWeb();     },     initTronWeb: function () {         var that = this;         this.tronWeb = new TronWeb('http://52.44.75.99:8090');         $.ajax({             url: 'Test.json',             method: 'get',             success: function (contract) {                 console.log(contract);                 if (contract) {                     that.abi = contract.abi;                     that.bytecode = contract.bytecode;                     that.contractAddress = contract.networks["*"] ? contract.networks["*"].address : "";                     $(".callBtn").removeAttr("disabled");                 }             }         });      },     bindEvents: function () {         var that = this;         $(".callBtn").on('click', function () {             var method = $(this).attr("method");             that.triggerContract(method, '', function (result) {                 console.log(result);                 if (result && result.length) {                     alert(result[0]);                 }             });         });     },     getContract: function (address, callback) {         this.tronWeb.getContract(address).then(function (res) {             callback && callback(res);         });     },     triggerContract: function (methodName, args, callback) {         var that = this;         var myContract = this.tronWeb.contract(that.abi);         myContract.at(that.contractAddress).then(function (contractInstance) {             if (!args || !args.length || args == '') {                 args = [];             }             args.push({                 fee_limit: that.fee_limit || 10000000,                 call_value: that.call_value || 0,             });             contractInstance[methodName].apply(null, args).then(function (res) {                 if (res.constant_result) {                     callback && callback(res.constant_result);                 } else {                     contractInstance[methodName].sendTransaction(res.transaction, that.privateKey).then(function (res) {                         callback && callback(res);                     });                 }             })          });     } };  $(function () {     $(window).load(function () {         App.init();     }); });
