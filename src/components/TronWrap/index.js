const _TronWeb = require('tronweb')
const chalk = require('chalk')
const constants = require('./constants')
const axios = require('axios')
const AppTrx = require('@ledgerhq/hw-app-trx').default;
const Transport = require('@ledgerhq/hw-transport-node-hid').default;

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

function isLedger(options) {
  return !options.mnemonic && options.path;
}

function init(options, extraOptions = {}) {

  if (instance) {
    return instance
  }

  if (extraOptions.verify && (
    !options || !(options.privateKey || options.mnemonic || options.path) || !(
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

  // support mnemonic
  const getPrivateKey = () => {
    if (options.mnemonic) {
      return _TronWeb.fromMnemonic(options.mnemonic, options.path).privateKey.slice(2)
    }
    return options.privateKey
  }

  TronWrap.prototype = new _TronWeb(
    options.fullNode || options.fullHost,
    options.solidityNode || options.fullHost,
    options.eventServer || options.fullHost,
    getPrivateKey()
  )

  const tronWrap = TronWrap.prototype
  // tronWrap._compilerVersion = 3

  tronWrap._tre = extraOptions.tre
  tronWrap._treUnlockedAccounts = {}
  tronWrap._nextId = 1

  tronWrap._isLedger = isLedger(options);

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

  
  tronWrap._setDefaultAddress = async function() {

    async function getDefaultAddress(options) {
      if (tronWrap._isLedger) {
        const transport = await Transport.create();
        const tronboxApp = new AppTrx(transport);
        const defaultAddress = await tronboxApp.getAddress(options.path).then(o => o.address);
        await transport.close();
        return defaultAddress;
      }
      return tronWrap.address.fromPrivateKey(tronWrap.defaultPrivateKey);
    }

    if (tronWrap._accounts.length) return;
  
    const defaultAddress = await getDefaultAddress(options);
    tronWrap._accounts = [defaultAddress];
    tronWrap._privateKeyByAccount = {
      [defaultAddress]: tronWrap.defaultPrivateKey
    };
  }
  tronWrap._accounts = [];
  tronWrap._privateKeyByAccount = {};

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

    const constructorAbi = option.abi.find((it) => it.type === 'constructor');
    if (constructorAbi && option.parameters && option.parameters.length) {
      option.rawParameter = this.utils.abi.encodeParamsV2ByABI(constructorAbi, option.parameters);
    }

    this._new(myContract, {
      bytecode: option.data,
      feeLimit: option.feeLimit || this.networkConfig.feeLimit,
      callValue: option.callValue || this.networkConfig.callValue,
      userFeePercentage,
      originEnergyLimit,
      abi: option.abi,
      parameters: option.parameters,
      rawParameter: option.rawParameter,
      name: option.contractName,
      from: option.from || ''
    }, option.privateKey)
      .then(() => {
        callback(null, myContract)
        option.address = myContract.address
      }).catch(function (reason) {
      callback(new Error(reason))
    })
  }

  tronWrap._new = async function (myContract, params, privateKey = tronWrap.defaultPrivateKey) {

    let signedTransaction
    let transaction
    try {
      
      // using ledger when path is specified while mnemonic is not
      if (tronWrap._isLedger) {
        const transport = await Transport.create();
        const tronboxApp = new AppTrx(transport);
        const address = await tronboxApp.getAddress(options.path).then(o => o.address);
        transaction = await tronWrap.transactionBuilder.createSmartContract(params, address);
        signedTransaction = {
          ...transaction,
          signature: [await tronboxApp.signTransactionHash(options.path, transaction.txID)]
        };
        // should close transport or the next creation will fail
        await transport.close();
      } else {
        const address = params.from ? params.from : tronWrap.address.fromPrivateKey(privateKey)
        transaction = await tronWrap.transactionBuilder.createSmartContract(params, address)
        if (tronWrap._treUnlockedAccounts[address]) {
          dlog('Unlocked account', { address })
          signedTransaction = transaction
          transaction.signature = []
        } else {
          signedTransaction = await tronWrap.trx.sign(transaction, privateKey)
        }
      }
      const result = await tronWrap.trx.sendRawTransaction(signedTransaction)
      

      if (!result || typeof result !== 'object') {
        return Promise.reject(`Error while broadcasting the transaction to create the contract ${params.name}. Most likely, the creator has either insufficient bandwidth or energy.`)
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
          delete tronWrap.trx.cache.contracts[signedTransaction.contract_address]
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

      myContract.loadAbi(params.abi || [])

      dlog('Contract deployed')
      return Promise.resolve(myContract)

    } catch (ex) {
      let e
      if (ex.toString().includes('does not exist')) {
        const url = this.networkConfig.fullNode + '/wallet/gettransactionbyid?value=' + signedTransaction.txID

        // eslint-disable-next-line no-ex-assign
        e = 'Contract ' + chalk.bold(params.name) + ' has not been deployed on the network.\nFor more details, check the transaction at:\n' + chalk.blue(url) +
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
        const address = option.methodArgs.from
        if (callSend === 'send' && (tronWrap._treUnlockedAccounts[address] || tronWrap._isLedger)) {
          dlog('Unlocked account', { address })

          const { abi, functionSelector, defaultOptions } = myContract.methodInstances[option.methodName]
          const rawParameter = this.utils.abi.encodeParamsV2ByABI(abi, option.args)
          const { stateMutability } = abi

          if (!['payable'].includes(stateMutability.toLowerCase())) {
            delete option.methodArgs.callValue
            delete option.methodArgs.tokenId
            delete option.methodArgs.tokenValue
          }
          const params = {}
          Object.keys(defaultOptions).forEach(_ => {
            params[_] = defaultOptions[_]
          })
          Object.keys(option.methodArgs).forEach(_ => {
            params[_] = option.methodArgs[_]
          })
          params.rawParameter = rawParameter

          return new Promise((resolve, reject) => {
            tronWrap.transactionBuilder.triggerSmartContract(option.address, functionSelector, params, [], address).then(async transaction => {
              if (!transaction.result || !transaction.result.result) {
                return reject('Unknown error: ' + JSON.stringify(transaction, null, 2))
              }

              transaction.transaction.signature = []
              if (tronWrap._isLedger && !tronWrap._treUnlockedAccounts[address]) {
                const transport = await Transport.create();
                const tronboxApp = new AppTrx(transport);
                transaction.transaction.signature = [
                  await tronboxApp.signTransactionHash(options.path, transaction.transaction.txID)
                ];
                await transport.close();
              }
              tronWrap.trx.sendRawTransaction(transaction.transaction).then(broadcast => {
                if (broadcast.code) {
                  const err = {
                    error: broadcast.code,
                    message: broadcast.code
                  }
                  if (broadcast.message) {
                    err.message = tronWrap.toUtf8(broadcast.message)
                    err.error = tronWrap.toUtf8(broadcast.message)
                  }
                  return reject(err)
                }

                return resolve(transaction.transaction.txID)
              }).catch(err => {
                return reject(err)
              })
            })
          })
        }

        if (callSend === 'send' && !tronWrap._treUnlockedAccounts[address] && !privateKey) {
          return callback('sender account not recognized')
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

  tronWrap.request = async function (request = {}) {
    return tronWrap.send(request.method, request.params || [])
  }

  tronWrap.send = async function (method = '', params = []) {
    const _send = async () => {
      try {
        const { data } = await axios.post(this.networkConfig.fullNode + '/tre', {
          method,
          params,
          id: this._nextId++,
          jsonrpc: '2.0'
        })
        const { result, error } = data
        if (result) return result

        if (error) throw error.message ? error.message : error
      } catch (error) {
        const err = error.message ? error.message : error
        throw new Error(err)
      }
    }

    switch (method) {
      case 'tre_setAccountBalance':
      case 'tre_setAccountStorageAt':
      case 'tre_setAccountCode':
      case 'tre_mine':
      case 'tre_blockTime':
        return _send()
      case 'tre_unlockedAccounts': {
        const result = await _send()
        if (result) {
          const accounts = params[0] || []
          for (let i = 0; i < accounts.length; i++) {
            const address = accounts[i]
            if (tronWrap._tre) {
              const hexAddr = tronWrap.address.toHex(address)
              const base58Addr = tronWrap.address.fromHex(address)
              tronWrap._treUnlockedAccounts[hexAddr] = true
              tronWrap._treUnlockedAccounts[base58Addr] = true
            }
          }
        }
        return result
      }
      default:
        return _send()
    }
  }

  const ins = new TronWrap;
  // can do it in a async function
  ins._setDefaultAddress();
  return ins;
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

