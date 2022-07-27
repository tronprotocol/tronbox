const _TronWeb = require('tronweb')
const chalk = require('chalk')
const constants = require('./constants')
const axios = require('axios')

let instance

function TronWrap() {

  this._toNumber = toNumber
  this.EventList = []
  this.filterMatchFunction = filterMatchFunction
  instance = this
  return instance
}

function toNumber(value) {
  if (!value) return null
  if (typeof value === 'string') {
    value = /^0x/.test(value) ? value : '0x' + value
  } else {
    value = value.toNumber()
  }
  return value
}

function filterMatchFunction(method, abi) {
  let methodObj = abi.filter((item) => item.name === method)
  if (!methodObj || methodObj.length === 0) {
    return null
  }
  methodObj = methodObj[0]
  const parametersObj = methodObj.inputs.map((item) => item.type)
  return {
    function: methodObj.name + '(' + parametersObj.join(',') + ')',
    parameter: parametersObj,
    methodName: methodObj.name,
    methodType: methodObj.type
  }
}

function sleep(millis) {
  return new Promise(resolve => setTimeout(resolve, millis))
}

function filterNetworkConfig(options) {
  const userFeePercentage =
    typeof options.userFeePercentage === 'number'
      ? options.userFeePercentage
      : typeof options.consume_user_resource_percent === 'number'
      ? options.consume_user_resource_percent
      : constants.deployParameters.userFeePercentage
  return {
    fullNode: options.fullNode || options.fullHost,
    feeLimit: options.feeLimit || options.fee_limit || constants.deployParameters.feeLimit,
    originEnergyLimit: options.originEnergyLimit || options.origin_energy_limit || constants.deployParameters.originEnergyLimit,
    callValue: options.callValue || options.call_value || constants.deployParameters.callValue,
    tokenValue: options.tokenValue || options.token_value || options.call_token_value,
    tokenId: options.tokenId || options.token_id,
    userFeePercentage
  }
}

function init(options, extraOptions = {}) {

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
      if (!options.privateKey) {
        throw new Error('It was not possible to instantiate TronWeb. Private key is missing in your "tronbox.js".')
      }
      if (!(
        options.fullHost || (options.fullNode && options.solidityNode && options.eventServer)
      )) {
        throw new Error('It was not possible to instantiate TronWeb. Fullhost url is missing in your "tronbox.js".')
      }
      throw new Error('It was not possible to instantiate TronWeb. Some required parameters are missing in your "tronbox.js".')
    }
  }

  TronWrap.prototype = new _TronWeb(
    options.fullNode || options.fullHost,
    options.solidityNode || options.fullHost,
    options.eventServer || options.fullHost,
    options.privateKey
  )

  const tronWrap = TronWrap.prototype
  // tronWrap._compilerVersion = 3

  tronWrap.networkConfig = filterNetworkConfig(options)
  if (extraOptions.log) {
    tronWrap._log = extraOptions.log
  }

  tronWrap._getNetworkInfo = async function () {
    const info = {
      parameters: {}, nodeinfo: {}
    }
    try {
      const res = await Promise.all([
        tronWrap.trx.getChainParameters(),
        tronWrap.trx.getNodeInfo()
      ])
      info.parameters = res[0] || {}
      info.nodeinfo = res[1] || {}
    } catch (err) {
    }
    return Promise.resolve(info)
  }

  tronWrap._getNetwork = function (callback) {
    callback && callback(null, options.network_id)
  }

  const defaultAddress = tronWrap.address.fromPrivateKey(tronWrap.defaultPrivateKey)
  tronWrap._accounts = [defaultAddress]
  tronWrap._privateKeyByAccount = {}
  tronWrap._privateKeyByAccount[defaultAddress] = tronWrap.defaultPrivateKey

  tronWrap._getAccounts = function (callback) {

    const self = this

    return new Promise((accept) => {
      function cb() {
        if (callback) {
          callback(null, self._accounts)
          accept()
        } else {
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
            for (const account of data) {
              const address = this.address.fromPrivateKey(account)
              self._privateKeyByAccount[address] = account
              self._accounts.push(address)
            }
          }
          self._accountsRequested = true
          return cb()
        })
        .catch(() => {
          self._accountsRequested = true
          return cb()
        })
    })
  }

  tronWrap._getContract = async function (address, callback) {
    const contractInstance = await tronWrap.trx.getContract(address || '')
    if (contractInstance) {
      callback && callback(null, contractInstance.contract_address)
    } else {
      callback(new Error('no code'))
    }
  }

  tronWrap._deployContract = function (option, callback) {

    const myContract = this.contract()
    const originEnergyLimit = option.originEnergyLimit || this.networkConfig.originEnergyLimit
    if (originEnergyLimit < 0 || originEnergyLimit > constants.deployParameters.originEnergyLimit) {
      throw new Error('Origin Energy Limit must be > 0 and <= 10,000,000')
    }

    const userFeePercentage =
      typeof options.userFeePercentage === 'number'
        ? options.userFeePercentage
        : this.networkConfig.userFeePercentage

    this._new(myContract, {
      bytecode: option.data,
      feeLimit: option.feeLimit || this.networkConfig.feeLimit,
      callValue: option.callValue || this.networkConfig.callValue,
      userFeePercentage,
      originEnergyLimit,
      abi: option.abi,
      parameters: option.parameters,
      name: option.contractName
    }, option.privateKey)
      .then(() => {
        callback(null, myContract)
        option.address = myContract.address
      }).catch(function (reason) {
      callback(new Error(reason))
    })
  }

  tronWrap._new = async function (myContract, options, privateKey = tronWrap.defaultPrivateKey) {

    let signedTransaction
    try {
      const address = tronWrap.address.fromPrivateKey(privateKey)
      const transaction = await tronWrap.transactionBuilder.createSmartContract(options, address)
      signedTransaction = await tronWrap.trx.sign(transaction, privateKey)
      const result = await tronWrap.trx.sendRawTransaction(signedTransaction)

      if (!result || typeof result !== 'object') {
        return Promise.reject(`Error while broadcasting the transaction to create the contract ${options.name}. Most likely, the creator has either insufficient bandwidth or energy.`)
      }

      if (result.code) {
        return Promise.reject(`${result.code} (${tronWrap.toUtf8(result.message)}) while broadcasting the transaction to create the contract ${options.name}`)
      }

      let contract
      dlog('Contract broadcasted', {
        result: result.result,
        transaction_id: transaction.txID,
        address: transaction.contract_address
      })
      for (let i = 0; i < 10; i++) {
        try {
          dlog('Requesting contract')
          contract = await tronWrap.trx.getContract(signedTransaction.contract_address)
          dlog('Contract requested')
          if (contract.contract_address) {
            dlog('Contract found')
            break
          }
        } catch (err) {
          dlog('Contract does not exist yet')
        }
        await sleep(500)
      }

      dlog('Reading contract data')

      if (!contract || !contract.contract_address) {
        throw new Error('Contract does not exist')
      }

      myContract.address = contract.contract_address
      myContract.bytecode = contract.bytecode
      myContract.deployed = true

      myContract.loadAbi(contract.abi.entrys || [])

      dlog('Contract deployed')
      return Promise.resolve(myContract)

    } catch (ex) {
      let e
      if (ex.toString().includes('does not exist')) {
        const url = this.networkConfig.fullNode + '/wallet/gettransactionbyid?value=' + signedTransaction.txID

        // eslint-disable-next-line no-ex-assign
        e = 'Contract ' + chalk.bold(options.name) + ' has not been deployed on the network.\nFor more details, check the transaction at:\n' + chalk.blue(url) +
          '\nIf the transaction above is empty, most likely, your address had no bandwidth/energy to deploy the contract.'
      }

      return Promise.reject(e || ex)
    }
  }

  tronWrap.triggerContract = function (option, callback) {
    const myContract = this.contract(option.abi, option.address)
    let callSend = 'send' // constructor and fallback
    option.abi.forEach(function (val) {
      if (val.name === option.methodName) {
        callSend = /payable/.test(val.stateMutability) ? 'send' : 'call'
      }
    })
    option.methodArgs || (option.methodArgs = {})
    option.methodArgs.from || (option.methodArgs.from = this._accounts[0])

    dlog(option.methodName, option.args, options.methodArgs)

    let privateKey
    if (callSend === 'send' && option.methodArgs.from) {
      privateKey = this._privateKeyByAccount[option.methodArgs.from]
    }

    if (!option.methodArgs.feeLimit) {
      option.methodArgs.feeLimit = this.networkConfig.feeLimit
    }

    this._getNetworkInfo()
      .then(info => {
        if (info.compilerVersion === '1') {
          delete option.methodArgs.tokenValue
          delete option.methodArgs.tokenId
        }
        return myContract[option.methodName](...option.args)[callSend](option.methodArgs || {}, privateKey)
      })
      .then(function (res) {
        callback(null, res)
      }).catch(function (reason) {
      if (typeof reason === 'object' && reason.error) {
        reason = reason.error
      }
      if (process.env.CURRENT === 'test') {
        callback(reason)
      } else {
        logErrorAndExit(console, reason)
      }
    })
  }

  return new TronWrap
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
  if (msg) {
    msg = msg.replace(/^error(:|) /i, '')
    if (msg === 'Invalid URL provided to HttpProvider') {
      msg = 'Either invalid or wrong URL provided to HttpProvider. Verify the configuration in your "tronbox.js"'
    }
    log(chalk.red(chalk.bold('ERROR:'), msg))
  } else {
    log('Error encountered, bailing. Network state unknown.')
  }
  // eslint-disable-next-line no-process-exit
  process.exit()
}

const dlog = function (...args) {
  if (process.env.DEBUG_MODE) {
    for (let i = 0; i < args.length; i++) {

      if (typeof args[i] === 'object') {
        try {
          args[i] = JSON.stringify(args[i], null, 2)
        } // eslint-disable-next-line no-empty
        catch (err) {
        }
      }
    }
    console.debug(chalk.blue(args.join(' ')))
  }
}


module.exports = init

module.exports.config = () => console.info('config')
module.exports.constants = constants
module.exports.logErrorAndExit = logErrorAndExit
module.exports.dlog = dlog
module.exports.sleep = sleep
module.exports.TronWeb = _TronWeb

