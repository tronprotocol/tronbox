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

function init(options) {

  if (instance) {
    return instance
  }

  TronWrap.prototype = new _TronWeb(
    options.fullNode,
    options.solidityNode,
    options.eventServer,
    options.privateKey
  );

  const tronWrap = TronWrap.prototype

  tronWrap._options = options;

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

      return axios.get(self._options.fullNode + '/admin/accounts-json')
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
    myContract.new({
      bytecode: option.data,
      fee_limit: option.fee_limit || Math.pow(10, 7),
      call_value: option.call_value || option.call_value || 0,
      userFeePercentage: option.consume_user_resource_percent || 30,
      abi: option.abi,
      parameters: option.parameters
    }, option.privateKey).then(() => {
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
