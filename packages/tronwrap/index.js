var _TronWeb = require("./tron-web/dist/TronWeb.node");

var axios = require('axios');

var instance;

function TronWrap() {

  this._toNumber = toNumber;
  this.EventList = [];
  this.filterMatchFunction = filterMatchFunction;
  instance = this;
  return instance;
}

function toNumber(value) {
  if (!value) return null;
  if (typeof value === 'string') {
    value = /^0x/.test(value) ? value : '0x' + value;
  } else {
    value = value.toNumber();
  }
  return value;
}

function filterMatchFunction(method, abi) {
  let methodObj = abi.filter((item) => item.name === method);
  if (!methodObj || methodObj.length === 0) {
    return null;
  }
  methodObj = methodObj[0];
  let parametersObj = methodObj.inputs.map((item) => item.type);
  return {
    function: methodObj.name + '(' + parametersObj.join(',') + ')',
    parameter: parametersObj,
    methodName: methodObj.name,
    methodType: methodObj.type
  }
}

function init(options, extraOptions) {

  if (instance) {
    return instance
  }

  if (extraOptions.verify && (
    !options || !options.privateKey || !(
      options.fullHost || (options.fullNode && options.solidityNode && options.eventServer)
    )
  )) {
    throw new Error('Network parameters are missing or the network set with the options --network does not exist.')
  }

  TronWrap.prototype = new _TronWeb(
    options.fullNode || options.fullHost,
    options.solidityNode || options.fullHost,
    options.eventServer || options.fullHost,
    options.privateKey
  );

  const tronWrap = TronWrap.prototype

  tronWrap.networkConfig = options;
  if (extraOptions.log) {
    tronWrap._log = extraOptions.log;
  }

  tronWrap._getNetwork = function (callback) {
    callback && callback(null, options.network_id);
  }

  const defaultAddress = tronWrap.address.fromPrivateKey(tronWrap.defaultPrivateKey)
  tronWrap._accounts = [defaultAddress]
  tronWrap._privateKeyByAccount = {}
  tronWrap._privateKeyByAccount[defaultAddress] = tronWrap.defaultPrivateKey

  tronWrap._getAccounts = function (callback) {

    const self = this

    return new Promise((accept, reject) => {
      function cb() {
        if (callback) {
          callback(null, self._accounts)
          accept()
        }
        else {
          accept(self._accounts)
        }
      }

      if (self._accountsRequested) {
        return cb()
      }

      return axios.get(self.networkConfig.fullNode + '/admin/accounts-json')
        .then(({data}) => {
          data = Array.isArray(data) ? data : data.privateKeys
          if (data.length > 0 && data[0].length === 64) {
            self._accounts = []
            self._privateKeyByAccount = {}
            for (let account of data) {
              let address = this.address.fromPrivateKey(account)
              self._privateKeyByAccount[address] = account
              self._accounts.push(address)
            }
          }
          self._accountsRequested = true;
          return cb();
        })
        .catch(err => {
          self._accountsRequested = true;
          return cb()
        })
    })
  }

  tronWrap._getContract = function (address, callback) {
    this.getContract(address || "").then(function (contractInstance) {
      if (contractInstance) {
        callback && callback(null, contractInstance);
      } else {
        callback(new Error("no code"))
      }
    });
  }

  tronWrap._deployContract = function (option, callback) {
    var myContract = this.contract();


    console.log(options.data === '608060405234801561001057600080fd5b5060008054600160a060020a0319163317905561023c806100326000396000f3006080604052600436106100615763ffffffff7c01000000000000000000000000000000000000000000000000000000006000350416630900f0108114610066578063445df0ac146100965780638da5cb5b146100bd578063fdacd576146100fb575b600080fd5b34801561007257600080fd5b5061009473ffffffffffffffffffffffffffffffffffffffff60043516610113565b005b3480156100a257600080fd5b506100ab6101c5565b60408051918252519081900360200190f35b3480156100c957600080fd5b506100d26101cb565b6040805173ffffffffffffffffffffffffffffffffffffffff9092168252519081900360200190f35b34801561010757600080fd5b506100946004356101e7565b6000805473ffffffffffffffffffffffffffffffffffffffff163314156101c1578190508073ffffffffffffffffffffffffffffffffffffffff1663fdacd5766001546040518263ffffffff167c010000000000000000000000000000000000000000000000000000000002815260040180828152602001915050600060405180830381600087803b1580156101a857600080fd5b505af11580156101bc573d6000803e3d6000fd5b505050505b5050565b60015481565b60005473ffffffffffffffffffffffffffffffffffffffff1681565b60005473ffffffffffffffffffffffffffffffffffffffff1633141561020d5760018190555b505600a165627a7a7230582020be6a5af9858b8d0705a662a03941a1d963e4b352f9a57eae01e6099d84f70f0029')


    options.data = '608060405234801561001057600080fd5b5060008054600160a060020a0319163317905561023c806100326000396000f3006080604052600436106100615763ffffffff7c01000000000000000000000000000000000000000000000000000000006000350416630900f0108114610066578063445df0ac146100965780638da5cb5b146100bd578063fdacd576146100fb575b600080fd5b34801561007257600080fd5b5061009473ffffffffffffffffffffffffffffffffffffffff60043516610113565b005b3480156100a257600080fd5b506100ab6101c5565b60408051918252519081900360200190f35b3480156100c957600080fd5b506100d26101cb565b6040805173ffffffffffffffffffffffffffffffffffffffff9092168252519081900360200190f35b34801561010757600080fd5b506100946004356101e7565b6000805473ffffffffffffffffffffffffffffffffffffffff163314156101c1578190508073ffffffffffffffffffffffffffffffffffffffff1663fdacd5766001546040518263ffffffff167c010000000000000000000000000000000000000000000000000000000002815260040180828152602001915050600060405180830381600087803b1580156101a857600080fd5b505af11580156101bc573d6000803e3d6000fd5b505050505b5050565b60015481565b60005473ffffffffffffffffffffffffffffffffffffffff1681565b60005473ffffffffffffffffffffffffffffffffffffffff1633141561020d5760018190555b505600a165627a7a7230582020be6a5af9858b8d0705a662a03941a1d963e4b352f9a57eae01e6099d84f70f0029'

    options.abi = [{"constant":false,"inputs":[{"name":"new_address","type":"address"}],"name":"upgrade","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"last_completed_migration","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"completed","type":"uint256"}],"name":"setCompleted","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"}]

    myContract.new({
      bytecode: option.data,
      feeLimit: this.networkConfig.feeLimit,
      callValue: this.networkConfig.callValue,
      userFeePercentage: this.networkConfig.userFeePercentage,
      originalEnergyLimit: this.networkConfig.originalEnergyLimit,
      abi: option.abi,
      parameters: option.parameters
    }, option.privateKey).then(result => {
      callback(null, myContract);
      option.address = myContract.address;
      if (option.address) {
        this.setEventListener(option);
      }
    }).catch(function (reason) {
      callback(new Error(reason))
    });
  }

  tronWrap.triggerContract = function (option, callback) {
    let myContract = this.contract(option.abi, option.address);
    var callSend = 'send' // constructor and fallback
    option.abi.forEach(function (val) {
      if (val.name === option.methodName) {
        callSend = /payable/.test(val.stateMutability) ? 'send' : 'call'
      }
    })
    option.methodArgs || (option.methodArgs = {})
    option.methodArgs.from || (option.methodArgs.from = this._accounts[0])

    var privateKey
    if (callSend === 'send' && option.methodArgs.from) {
      privateKey = this._privateKeyByAccount[option.methodArgs.from]
    }
    // console.debug(option.methodName, option.args, option.methodArgs);
    myContract[option.methodName](...option.args)[callSend](option.methodArgs || {}, privateKey)
      .then(function (res) {
        callback(null, res)
      }).catch(function (reason) {
      if (typeof reason === 'object' && reason.error) {
        reason = reason.error
      }
      callback(new Error(reason))
    });
  }

  tronWrap.setEventListener = function (option, instance, transaction) {
    var that = this;
    var abi = option.abi, myEvent;
    abi.forEach(element => {
      if (element.type == 'event') {
        var event = that.EventList.filter((item) => (item.name == element.name && item.address == option.address));
        if (event && event.length) {
          myEvent = event[0].event;
          return;
        }
        // console.log(element.name);
        var myContract = that.contract(option.abi);
        myContract.at(option.address).then(function (instance) {
          //部署成功，但是获取不到合约内容，需要截获
          if (!instance.address) return;
          var myEvent = instance[element.name]();
          myEvent.watch(function (err, result) {
            if (err && err != "") return;
            var eventResult = "";
            if (result && result.length) {
              eventResult = result;
              if (transaction) {
                result.forEach((item) => {
                  if (item.transaction_id == transaction.txID) {
                    eventResult = item.result;
                    myEvent.stopWatching();
                  }
                });
              }
              // console.log('eventResult:', JSON.stringify(eventResult));
            }
          });
        })
        that.EventList.push({name: element.name, event: myEvent, address: option.address});
      }
    });
  }

  return new TronWrap;
}

module.exports = init;
module.exports.config = () => console.log('config')
