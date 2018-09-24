var _TronWeb = require("./tron-web/dist/TronWeb.node");
var defaultOptions = require('./default-options');
var instance;

function TronWrap() {

  this._getNetwork = _getNetwork;
  this._getAccounts = _getAccounts;
  this._toNumber = toNumber;
  this.EventList = [];
  this.filterMatchFunction = filterMatchFunction;
  instance = this;
  return instance;
}

function _getNetwork(callback) {
  callback && callback(null, '*');
}

function _getAccounts(callback) {
  callback && callback(null, ['TPL66VK2gCXNCD7EJg9pgJRfqcRazjhUZY']);
}

function toNumber(value) {
  if (!value) return null;
  if ((typeof value == 'string') && value.indexOf('0x') <= -1) {
    value = '0x' + value;
  } else {
    value = value.toNumber();
  }
  return value;
}

function filterMatchFunction(method, abi) {
  let methodObj = abi.filter((item) => item.name == method);
  if (methodObj == null || methodObj.length == 0) {
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

  TronWrap.prototype._getContract = function (address, callback) {
    this.getContract(address || "").then(function (contractInstance) {
      if (contractInstance) {
        callback && callback(null, contractInstance);
      } else {
        callback(new Error("no code"))
      }
    });
  }

  TronWrap.prototype._deployContract = function (option, callback) {
    var myContract = this.contract();
    myContract.new({
      bytecode: option.data,
      feeLimit: option.fee_limit,
      callValue: option.call_value,
      userFeePercentage: 30,
      abi: option.abi
    }, option.privateKey).then(() => {
      callback(null, myContract);
      option.address = myContract.address;
      if (option.address) {
        this.setEventListener(option);
      }
    }).catch(function (reason) {
      console.log('失败：' + reason);
      callback(new Error(reason))
    });
  }

  TronWrap.prototype.triggerContract = function (option, callback) {
    let myContract = this.contract(option.abi, option.address);
    var callSend = 'send' // constructor and fallback
    option.abi.forEach(function (val) {
      if (val.name === option.methodName) {
        callSend = /payable/.test(val.stateMutability) ? 'send' : 'call'
      }
    })
    myContract[option.methodName](...option.args)[callSend]({
      fee_limit: option.fee_limit,
      call_value: option.call_value || 0,
    })
      .then(function (res) {
        if (!Array.isArray(res)) {
          res = [res]
        }
        callback(null, res)
      }).catch(function (reason) {
      callback(new Error(reason))
    });
  }

  TronWrap.prototype.setEventListener = function (option, instance, transaction) {
    var that = this;
    var abi = option.abi, myEvent;
    abi.forEach(element => {
      if (element.type == 'event') {
        var event = that.EventList.filter((item) => (item.name == element.name && item.address == option.address));
        if (event && event.length) {
          myEvent = event[0].event;
          // console.log("已设置监听:" + element.name);
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
