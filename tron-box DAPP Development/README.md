
# Tron-Box Dapp Development Instance

This appendix mainly introduces the development of the front-end interactive Dapp based on Tron-Box. The following is a detailed step by step decomposition. 

## Project Creation and Initialization

1. Create Project
```
$ mkdir Dapp-demo
```
2. Initialize Dapp by invoking the below command (image: successful Dapp initialization record)

```
$ cd Dapp-demo
```
```
$ tronbox init
```

Remarks:

**contracts**: Used to place contracts<br> 
**migrate**: Script for storing the migration contract<br>
**test**: Used to store written test scripts<br>
**tronbox.js**: The information about the network configure is stored, which will be explained in the next section (Configuring Network Information)<br>


3. Configure Network Information

Network configuration is generally divided into development environment (development) and online formal production (production), but other test network environments can be added. The following is the default network configuration information of Tron-Box:

Below describes the meaning of each parameter in the network configuration:<br>

**from**: Primary account address for contract deployment (base58)<br>
**privateKey**: Private key corresponding to the contract deployment master account<br>
**consume_user_resource_percent**: Parameters for deployment; can use default settings<br>
**fee_limit**: Parameters for deployment; can use default settings<br>
**host**: Contract deployment destination IP address (This IP needs to start FullNode node service)<br>
**port**: The port corresponding to contract deployment destination IP address API (port number corresponding to FullNode node API service)<br>
**eventServer**: The URL of the contract deployment destination event monitoring service (Need to be on same IP as the API server, otherwise the event callback cannot be monitored. For example, the API service address is http://127.0.0.1:8090, then the event listener service address is http://127.0.0.1:****)<br>
**network_id**: Can use default settings<br>

4. Manually create in the current directory of the project, package.json. For example, execute later npm install:

```
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

```
5. Create a front-end resource file directory (src), and a list of resource file directories. Example below:

6. Manually create a resource dependency file in the root directory to configure bs-config.json

7. Write front-end code
Important: The required tronweb needs to be downloaded from here [here](https://github.com/tronprotocol/tron-web 下载并打包成tronweb.js) and packaged into tronweb.js. For related APIs, please refer to tronweb official (for specific code, see attached).  

8. Operation

Execute the command <npm run dev> to start the service. The following is an appendix to the code:

```
附: index.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>DappDemo</title>
  </head>
  <body>
    <div class="container">
      <div class="row">
        <div class="col-xs-12 col-sm-8 col-sm-push-2">
          <h1 class="text-center">DappDemo</h1>
          <hr/>
          <br/>
        </div>
      </div>

      <div class="row">
        <button class="callBtn" method="f" disabled="disabled">call method f()</button>
        <button class="callBtn" method="g" disabled="disabled">call method g()</button>
      </div>
    </div>

    <!-- jQuery (necessary for Bootstrap's JavaScript plugins) -->
    <script src="js/jquery-2.1.4.min.js"></script>
    <!-- Include all compiled plugins (below), or include individual files as needed -->
    <script src="js/bootstrap.min.js"></script>
    <script src="js/tronweb.js"></script>
    <script src="js/app.js"></script>
  </body>
</html>

附：App.js
App = {
    tronWebProvider: null,
    contracts: {},
    tronWeb: null,
    account: "TPL66VK2gCXNCD7EJg9pgJRfqcRazjhUZY",
    privateKey: "da146374a75310b9666e834ee4ad0866d6f4035967bfc76217c5a495fff9f0d0",
    contractAddress: null,
    init: function () {
        this.initData();
        this.bindEvents();
    },
    initData: function () {
        this.initTronWeb();
    },
    initTronWeb: function () {
        var that = this;
        this.tronWeb = new TronWeb('http://52.44.75.99:8090');
        $.ajax({
            url: 'Test.json',
            method: 'get',
            success: function (contract) {
                console.log(contract);
                if (contract) {
                    that.abi = contract.abi;
                    that.bytecode = contract.bytecode;
                    that.contractAddress = contract.networks["*"] ? contract.networks["*"].address : "";
                    $(".callBtn").removeAttr("disabled");
                }
            }
        });

    },
    bindEvents: function () {
        var that = this;
        $(".callBtn").on('click', function () {
            var method = $(this).attr("method");
            that.triggerContract(method, '', function (result) {
                console.log(result);
                if (result && result.length) {
                    alert(result[0]);
                }
            });
        });
    },
    getContract: function (address, callback) {
        this.tronWeb.getContract(address).then(function (res) {
            callback && callback(res);
        });
    },
    triggerContract: function (methodName, args, callback) {
        var that = this;
        var myContract = this.tronWeb.contract(that.abi);
        myContract.at(that.contractAddress).then(function (contractInstance) {
            if (!args || !args.length || args == '') {
                args = [];
            }
            args.push({
                fee_limit: that.fee_limit || 10000000,
                call_value: that.call_value || 0,
            });
            contractInstance[methodName].apply(null, args).then(function (res) {
                if (res.constant_result) {
                    callback && callback(res.constant_result);
                } else {
                    contractInstance[methodName].sendTransaction(res.transaction, that.privateKey).then(function (res) {
                        callback && callback(res);
                    });
                }
            })

        });
    }
};

$(function () {
    $(window).load(function () {
        App.init();
    });
});

```




