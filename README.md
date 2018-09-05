# tron-box
Tronbox user guide
## Installation
`$ npm install -g tronbox`
## OS requirement
- NodeJS 5.0+
- Windows, Linux, or Mac OS X
<br>
## features
1. Initialize a customer Tronbox project<br>
`$ tronbox init`
<br>
2. Download a Dapp, ex: metacoin-box<br>
`$ tronbox unbox metacoin`
<br>
3. Contract Compiler<br>
`$ tronbox compile`<br>
--compile-all for compile all contracts<br>
$ tronbox compile --compile—all<br>
optional parameter：<br>
--compile-all: force compile all contracts。<br>
--network save results to a specifict hose network<br>
<br>
## 4、migrate<br>
$ tronbox migrate
<br>
$ tronbox migrate --reset 
<br>
## 5、console<br>
start console using default network, connect to a tvm client, can be changed using --network
<br>
$ tronbox console
<br>
supports tronbox command, EX: migrate --reset === tronbox migrate --reset
<br>
## Extra Feature:<br>
1）all compiled contract can be used same as develop and testing in the front-end<br>
2）for each command, your contract will be re-loaded. <br> after using migrate --reset, you can use the new address andd binary code<br>
3）promiss will automatically be logged dont have to use extra then command<br>
<br>
6、testing<br>
$ tronbox test<br>
for specific file：<br>
$ tronbox test ./path/to/test/file.js<br>
