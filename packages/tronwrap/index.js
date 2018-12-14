var _TronWeb = require("./tron-web/dist/TronWeb.node");
var chalk = require('chalk')
var constants = require('./constants')
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

function filterNetworkConfig(options) {
  return {
    fullNode: options.fullNode || options.fullHost,
    feeLimit: options.feeLimit || options.fee_limit || constants.deployParameters.feeLimit,
    userFeePercentage: options.userFeePercentage || options.consume_user_resource_percent || constants.deployParameters.userFeePercentage,
    originEnergyLimit: options.originEnergyLimit || options.origin_energy_limit || constants.deployParameters.originEnergyLimit,
    callValue: options.callValue || options.call_value || constants.deployParameters.callValue
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
    if (!options) {
      throw new Error('It was not possible to instantiate TronWeb. The chosen network does not exist in your "tronbox.js".')
    } else {
      throw new Error('It was not possible to instantiate TronWeb. Some required parameters are missing in your "tronbox.js".')
    }
  }

  TronWrap.prototype = new _TronWeb(
    options.fullNode || options.fullHost,
    options.solidityNode || options.fullHost,
    options.eventServer || options.fullHost,
    options.privateKey
  );

  const tronWrap = TronWrap.prototype

  tronWrap.networkConfig = filterNetworkConfig(options);
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

    const myContract = this.contract();
    let originEnergyLimit = option.originEnergyLimit || this.networkConfig.originEnergyLimit
    if (originEnergyLimit < 0 || originEnergyLimit > constants.deployParameters.originEnergyLimit) {
      throw new Error('Origin Energy Limit must be > 0 and <= 10,000,000')
    }

    this._new(myContract, {
      bytecode: option.data,
      feeLimit: option.feeLimit || this.networkConfig.feeLimit,
      callValue: option.callValue || this.networkConfig.callValue,
      userFeePercentage: option.userFeePercentage || this.networkConfig.userFeePercentage,
      originEnergyLimit,
      abi: option.abi,
      parameters: option.parameters,
      name: option.contractName
    }, option.privateKey)
      .then(result => {
        callback(null, myContract);
        option.address = myContract.address;
      }).catch(function (reason) {
      callback(new Error(reason))
    });
  }

  tronWrap._new = function (myContract, options, privateKey = tronWrap.defaultPrivateKey, callback) {

    let signedTransaction

    const address = tronWrap.address.fromPrivateKey(privateKey);
    return tronWrap.transactionBuilder.createSmartContract(options, address)
      .then(transaction => {
        return tronWrap.trx.sign(transaction, privateKey)
      })
      .then(result => {
        signedTransaction = result
        return tronWrap.trx.sendRawTransaction(signedTransaction);
      })
      .then(contract => {
        if (!contract.result) {
          throw new Error('Unknown error: ' + JSON.stringify(contract, null, 2))
        } else {
          return tronWrap.trx.getContract(signedTransaction.contract_address)
        }
      })
      .then(contract => {
        if (!contract.contract_address)
          callback('Unknown error: ' + JSON.stringify(contract, null, 2));

        myContract.address = contract.contract_address;
        myContract.bytecode = contract.bytecode;
        myContract.deployed = true;

        myContract.loadAbi(contract.abi.entrys);

        return Promise.resolve(myContract);
      })
      .catch(ex => {
        if (ex.toString().includes('does not exist')) {
          let url = this.networkConfig.fullNode + '/wallet/gettransactionbyid?value=' + signedTransaction.txID

          ex = 'Contract ' + chalk.bold(options.contractName) + ' has not been deployed on the network.\nFor more details, check the transaction at:\n' + chalk.blue(url)
        }
        return Promise.reject(ex);
      })
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
    myContract[option.methodName](...option.args)[callSend](option.methodArgs || {}, privateKey)
      .then(function (res) {
        callback(null, res)
      }).catch(function (reason) {
      if (typeof reason === 'object' && reason.error) {
        reason = reason.error
      }
      logErrorAndExit(console, reason)
      // callback(new Error(reason))
    });
  }

  return new TronWrap;
}

module.exports = init;
module.exports.config = () => console.log('config')
module.exports.constants = constants

const logErrorAndExit = (logger, err) => {

  function log(str) {
    try {
      logger.error(str)
    } catch (err) {
      console.error(str)
    }
  }

  let msg = typeof err === 'string' ? err : err.message
  if (msg) {
    msg = msg.replace(/^error(:|) /i, '')
    if (msg === 'Invalid URL provided to HttpProvider') {
      msg = 'Either invalid or wrong URL provided to HttpProvider. Verify the configuration in your "tronbox.js"'
    }
    log(chalk.red(chalk.bold('ERROR:'), msg))
  } else {
    log("Error encountered, bailing. Network state unknown.");
  }
  process.exit()
}

module.exports.logErrorAndExit = logErrorAndExit
