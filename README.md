# tron-box
Tronbox使用手册
安装方式
$ npm install -g tronbox
环境要求
·NodeJS 5.0+
·Windows，Linux，或Mac OS X
常用功能菜单
1、初始化tronbox项目
$ tronbox init
2、下载Dapp，例如metacoin-box
$ tronbox unbox metacoin
3、合约编译
$ tronbox compile
如果你想编译全部文件，可以使用--compile-all选项。
$ tronbox compile --compile—all
可选参数：
--compile-all: 强制编译所有合约。
--network 名称：指定使用的网络，保存编译的结果到指定的网络上。
4、合约发布 
$ tronbox migrate
这个命令会执行所有的位于migrations目录内的移植脚本。如果你之前的移植是成功执行的。tronbox migrate仅会执行新创建的移植。如果没有新的移植脚本，这个命令不同执行任何操作。可以使用选项--reset来从头执行移植脚本。
$ tronbox migrate --reset
5、启动控制台
这会使用默认网络来调起一个控制台，会自动连接到一个运行中的以太坊客户端。你可以使用选项--network来修改这个特性
$ tronbox console
控制台支持tronbox命令行支持的命令，比如，你可以在控制台中执行migrate --reset，其效果与在命令行中执行tronbox migrate --reset的效果一致。tronbox的控制台额外增加如下特性：
1）所有已经编译的合约都可用。就像在开发测试，前端代码中，或者移植代码中那样使用。
2）在每个命令后，你的合约会被重新加载。如使用migrate --reset命令后，你可以立即使用新分配的地址和二进制。
3）所有命令返回的promise，会自动解析，直接打印出结果，你可以不用输入then()，简化了命令。
6、测试
要执行测试，执行下面的命令：
$ tronbox test
你也可以对单个文件执行测试：
$ tronbox test ./path/to/test/file.js
