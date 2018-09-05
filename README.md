# tron-box
Tronbox user guide
## install
$ npm install -g tronbox
## OS requirement
·NodeJS 5.0+
·Windows，Linux，OR Mac OS X
##features
1、intialize a custome tronbox project
$ tronbox init
<br>
2、download Dapp, EX: metacoin-box
$ tronbox unbox metacoin
<br>
3、Compile
$ tronbox compile
--compile-all for compile all contracts
$ tronbox compile --compile—all
optional parameter：
--compile-all: force compile all contracts。
--network save results to a specifict hose network
<br>
4、migrate
$ tronbox migrate
<br>
$ tronbox migrate --reset 
<br>
5、console
start console using default network, connect to a tvm client, can be changed using --network
<br>
$ tronbox console
<br>
supports tronbox command, EX: migrate --reset === tronbox migrate --reset
<br>
Extra Feature:
1）all compiled contract can be used same as develop and testing in the front-end<br>
2）for each command, your contract will be re-loaded. <br> after using migrate --reset, you can use the new address andd binary code<br>
3）promiss will automatically be logged dont have to use extra then command<br>
<br>
6、testing
$ tronbox test<br>
for specific file：
$ tronbox test ./path/to/test/file.js
