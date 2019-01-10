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
  if(!value) return null;
  if(typeof value === 'string') {
    value = /^0x/.test(value) ? value : '0x' + value;
  } else {
    value = value.toNumber();
  }
  return value;
}

function filterMatchFunction(method, abi) {
  let methodObj = abi.filter((item) => item.name === method);
  if(!methodObj || methodObj.length === 0) {
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

function sleep(millis) {
  return new Promise(resolve => setTimeout(resolve, millis));
}

function filterNetworkConfig(options) {
  return {
    fullNode: options.fullNode || options.fullHost,
    feeLimit: options.feeLimit || options.fee_limit || constants.deployParameters.feeLimit,
    userFeePercentage: options.userFeePercentage || options.consume_user_resource_percent || constants.deployParameters.userFeePercentage,
    originEnergyLimit: options.originEnergyLimit || options.origin_energy_limit || constants.deployParameters.originEnergyLimit,
    callValue: options.callValue || options.call_value || constants.deployParameters.callValue,
    tokenValue: options.tokenValue || options.token_value || options.call_token_value,
    tokenId: options.tokenId || options.token_id
  }
}

function init(options, extraOptions) {

  if(instance) {
    return instance
  }

  if(extraOptions.verify && (
    !options || !options.privateKey || !(
      options.fullHost || (options.fullNode && options.solidityNode && options.eventServer)
    )
  )) {
    if(!options) {
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
  tronWrap._compilerVersion = 1

  tronWrap.networkConfig = filterNetworkConfig(options);
  if(extraOptions.log) {
    tronWrap._log = extraOptions.log;
  }

  tronWrap._getNetworkInfo = async function () {
    let info = {
      javaTronVersion: '<3.2.2',
      compilerVersion: '1'
    }
    try {
      const [proposals, nodeInfo] = await Promise.all([
        tronWrap.trx.getChainParameters(),
        tronWrap.trx.getNodeInfo()
      ])

      for(let proposal of proposals) {
        if(proposal.key === 'getAllowTvmTransferTrc10') {
          if(proposal.value) {
            info.compilerVersion = '3'
          }
          break
        }
      }
      if(nodeInfo) {
        info.javaTronVersion = nodeInfo.configNodeInfo.codeVersion
      }
    } catch (err) {
    }
    return Promise.resolve(info)
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
        if(callback) {
          callback(null, self._accounts)
          accept()
        }
        else {
          accept(self._accounts)
        }
      }

      if(self._accountsRequested) {
        return cb()
      }

      return axios.get(self.networkConfig.fullNode + '/admin/accounts-json')
        .then(({data}) => {
          data = Array.isArray(data) ? data : data.privateKeys
          if(data.length > 0 && data[0].length === 64) {
            self._accounts = []
            self._privateKeyByAccount = {}
            for(let account of data) {
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

  tronWrap._getContract = async function (address, callback) {
    const contractInstance = await tronWrap.trx.getContract(address || "")
    if(contractInstance) {
      callback && callback(null, contractInstance.contract_address);
    } else {
      callback(new Error("no code"))
    }
  }

  tronWrap._deployContract = function (option, callback) {

    const myContract = this.contract();
    let originEnergyLimit = option.originEnergyLimit || this.networkConfig.originEnergyLimit
    if(originEnergyLimit < 0 || originEnergyLimit > constants.deployParameters.originEnergyLimit) {
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

  tronWrap._new = async function (myContract, options, privateKey = tronWrap.defaultPrivateKey, callback) {

    let signedTransaction
    try {
      const address = tronWrap.address.fromPrivateKey(privateKey);
      const transaction = await tronWrap.transactionBuilder.createSmartContract(options, address)
      signedTransaction = await tronWrap.trx.sign(transaction, privateKey)
      const result = await tronWrap.trx.sendRawTransaction(signedTransaction)

      if(!result) {
        return Promise.reject('Transaction not broadcasted')
      }

      let contract
      dlog('Contract broadcasted', {
        result: result.result,
        transaction_id: transaction.txID,
        address: transaction.contract_address
      })
      for(let i = 0; i < 10; i++) {
        try {
          dlog('Requesting contract')
          contract = await tronWrap.trx.getContract(signedTransaction.contract_address)
          dlog('Contract requested')
          if(contract.contract_address) {
            dlog('Contract found')
            break
          }
        } catch (err) {
          dlog('Contract does not exist yet')
        }
        await sleep(500)
      }

      dlog('Reading contract data')

      if(!contract || !contract.contract_address) {
        throw new Error('Contract does not exist')
      }

      myContract.address = contract.contract_address;
      myContract.bytecode = contract.bytecode;
      myContract.deployed = true;

      myContract.loadAbi(contract.abi.entrys);

      dlog('Contract deployed')
      return Promise.resolve(myContract)

    } catch (ex) {
      if(ex.toString().includes('does not exist')) {
        let url = this.networkConfig.fullNode + '/wallet/gettransactionbyid?value=' + signedTransaction.txID

        ex = 'Contract ' + chalk.bold(options.name) + ' has not been deployed on the network.\nFor more details, check the transaction at:\n' + chalk.blue(url) +
          '\nIf the transaction above is empty, most likely, your address had no bandwidth/energy to deploy the contract.'
      }

      return Promise.reject(ex);
    }
  }

  tronWrap.triggerContract = function (option, callback) {
    let myContract = this.contract(option.abi, option.address);
    var callSend = 'send' // constructor and fallback
    option.abi.forEach(function (val) {
      if(val.name === option.methodName) {
        callSend = /payable/.test(val.stateMutability) ? 'send' : 'call'
      }
    })
    option.methodArgs || (option.methodArgs = {})
    option.methodArgs.from || (option.methodArgs.from = this._accounts[0])

    dlog(option.methodName, option.args, options.methodArgs)

    var privateKey
    if(callSend === 'send' && option.methodArgs.from) {
      privateKey = this._privateKeyByAccount[option.methodArgs.from]
    }

    this._getNetworkInfo()
      .then(info => {
        if(info.compilerVersion === '1') {
          delete option.methodArgs.tokenValue
          delete option.methodArgs.tokenId
        }
        return myContract[option.methodName](...option.args)[callSend](option.methodArgs || {}, privateKey)
      })
      .then(function (res) {
        callback(null, res)
      }).catch(function (reason) {
      if(typeof reason === 'object' && reason.error) {
        reason = reason.error
      }
      if(process.env.CURRENT === 'test') {
        callback(reason)
      } else {
        logErrorAndExit(console, reason)
      }
    });
  }

  return new TronWrap;
}


const logErrorAndExit = (logger, err) => {

  function log(str) {
    try {
      logger.error(str)
    } catch (err) {
      console.error(str)
    }
  }

  let msg = typeof err === 'string' ? err : err.message
  if(msg) {
    msg = msg.replace(/^error(:|) /i, '')
    if(msg === 'Invalid URL provided to HttpProvider') {
      msg = 'Either invalid or wrong URL provided to HttpProvider. Verify the configuration in your "tronbox.js"'
    }
    log(chalk.red(chalk.bold('ERROR:'), msg))
  } else {
    log("Error encountered, bailing. Network state unknown.");
  }
  process.exit()
}

const dlog = function (...args) {
  if(process.env.DEBUG_MODE) {
    for(let i = 0; i < args.length; i++) {

      if(typeof args[i] === 'object') {
        try {
          args[i] = JSON.stringify(args[i], null, 2)
        } catch (err) {
        }
      }
    }
    console.log(chalk.blue(args.join(' ')))
  }
}


module.exports = init;

module.exports.config = () => console.log('config')
module.exports.constants = constants
module.exports.logErrorAndExit = logErrorAndExit
module.exports.dlog = dlog
module.exports.sleep = sleep
