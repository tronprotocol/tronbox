const { ethers } = require('ethers');
const { TronWeb: _TronWeb } = require('tronweb');
const chalk = require('chalk');
const constants = require('./constants');
const axios = require('axios');
const ConsoleLogger = require('../ConsoleLogger');

let instance;

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
  let methodObj = abi.filter(item => item.name === method);
  if (!methodObj || methodObj.length === 0) {
    return null;
  }
  methodObj = methodObj[0];
  const parametersObj = methodObj.inputs.map(item => item.type);
  return {
    function: methodObj.name + '(' + parametersObj.join(',') + ')',
    parameter: parametersObj,
    methodName: methodObj.name,
    methodType: methodObj.type
  };
}

function sleep(millis) {
  return new Promise(resolve => setTimeout(resolve, millis));
}

function isLocalNode(url) {
  try {
    const { hostname } = new URL(url);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '0.0.0.0';
  } catch {
    return false;
  }
}

function filterNetworkConfig(options) {
  const userFeePercentage =
    typeof options.userFeePercentage === 'number'
      ? options.userFeePercentage
      : typeof options.consume_user_resource_percent === 'number'
      ? options.consume_user_resource_percent
      : constants.deployParameters.userFeePercentage;
  return {
    fullNode: options.fullNode || options.fullHost,
    feeLimit: options.feeLimit || options.fee_limit || constants.deployParameters.feeLimit,
    originEnergyLimit:
      options.originEnergyLimit || options.origin_energy_limit || constants.deployParameters.originEnergyLimit,
    callValue: options.callValue || options.call_value || constants.deployParameters.callValue,
    tokenValue: options.tokenValue || options.token_value || options.call_token_value,
    tokenId: options.tokenId || options.token_id,
    userFeePercentage,

    gas: options.gas || options.gasLimit,
    gasPrice: options.gasPrice,
    maxPriorityFeePerGas: options.maxPriorityFeePerGas,
    maxFeePerGas: options.maxFeePerGas
  };
}

function init(options, extraOptions = {}) {
  if (instance) {
    return instance;
  }

  if (extraOptions.verify) {
    const configFile = extraOptions.evm ? 'tronbox-evm-config.js' : 'tronbox-config.js';
    const clientName = extraOptions.evm ? 'Ethers' : 'TronWeb';

    if (!options) {
      throw new Error(
        `It was not possible to instantiate ${clientName}. The chosen network does not exist in your "${configFile}".`
      );
    }

    if (!(options.privateKey || options.mnemonic)) {
      throw new Error(
        `It was not possible to instantiate ${clientName}. The configuration key \`privateKey\` or \`mnemonic\` is missing in your "${configFile}".`
      );
    }

    if (!(options.fullHost || (options.fullNode && options.solidityNode && options.eventServer))) {
      throw new Error(
        `It was not possible to instantiate ${clientName}. The configuration key \`fullHost\` is missing in your "${configFile}".`
      );
    }
  }

  const getPrivateKey = () => {
    const privateKey = options.mnemonic
      ? _TronWeb.fromMnemonic(options.mnemonic, options.path).privateKey
      : options.privateKey;

    if (typeof privateKey !== 'string' || !privateKey) {
      throw new Error('Invalid privateKey. Expected a non-empty string.');
    }

    return privateKey.replace(/^0x/, '');
  };

  TronWrap.prototype = new _TronWeb(
    options.fullNode || options.fullHost,
    options.solidityNode || options.fullHost,
    options.eventServer || options.fullHost,
    getPrivateKey()
  );

  const tronWrap = TronWrap.prototype;

  tronWrap._tre = extraOptions.tre;
  tronWrap._treUnlockedAccounts = {};
  tronWrap._nextId = 1;

  tronWrap.networkConfig = filterNetworkConfig(options);
  if (extraOptions.logger) {
    tronWrap._log = extraOptions.logger;
  }
  if (extraOptions.evm) {
    const provider = new ethers.JsonRpcProvider(options.fullNode || options.fullHost);
    const wallet = new ethers.Wallet(getPrivateKey(), provider);
    tronWrap._ethers_wallets = { [wallet.address]: wallet };
    tronWrap._ethers_accounts = [wallet.address];
    tronWrap._ethers = {
      ...ethers,
      provider,
      getSigner: address => tronWrap._ethers_wallets[address],
      getSigners: () => Object.values(tronWrap._ethers_wallets)
    };
  }

  tronWrap._getNetworkInfo = async function () {
    const info = {
      parameters: {},
      nodeinfo: {}
    };
    try {
      const res = await Promise.all([tronWrap.trx.getChainParameters(), tronWrap.trx.getNodeInfo()]);
      info.parameters = res[0] || {};
      info.nodeinfo = res[1] || {};
    } catch (err) {}
    return Promise.resolve(info);
  };

  tronWrap._getNetwork = function (callback) {
    callback && callback(null, options.network_id);
  };

  const defaultAddress = tronWrap.address.fromPrivateKey(tronWrap.defaultPrivateKey);
  tronWrap._accounts = [defaultAddress];
  tronWrap._privateKeyByAccount = {};
  tronWrap._privateKeyByAccount[defaultAddress] = tronWrap.defaultPrivateKey;

  tronWrap._findMethodAbi = function (methodName, abi) {
    let funAbi = {};

    if (methodName.includes('(')) {
      for (const item of abi) {
        if (/function/i.test(item.type) && item.name) {
          const iface = new tronWrap.utils.ethersUtils.Interface([item]);
          const functionSelector = iface.getFunction(item.name).format('sighash');
          if (functionSelector === methodName) {
            funAbi = item;
            break;
          }
        }
      }
    } else {
      for (const item of abi) {
        if (item.name === methodName) {
          funAbi = item;
          break;
        }
      }
    }

    return funAbi;
  };

  tronWrap._getAccounts = function (callback) {
    if (extraOptions.evm) return tronWrap._evmGetAccounts(callback);

    const self = this;

    return new Promise(accept => {
      function cb() {
        if (callback) {
          callback(null, self._accounts);
          accept();
        } else {
          accept(self._accounts);
        }
      }

      if (self._accountsRequested) {
        return cb();
      }

      if (!isLocalNode(self.networkConfig.fullNode)) {
        self._accountsRequested = true;
        return cb();
      }

      return axios
        .get(self.networkConfig.fullNode + '/admin/accounts-json')
        .then(({ data }) => {
          data = Array.isArray(data) ? data : data.privateKeys;
          if (data.length > 0 && data[0].length === 64) {
            self.setPrivateKey(data[0]);
            tronWrap.setPrivateKey(data[0]);
            self._accounts = [];
            self._privateKeyByAccount = {};
            for (const account of data) {
              const address = this.address.fromPrivateKey(account);
              self._privateKeyByAccount[address] = account;
              self._accounts.push(address);
            }
          }
          self._accountsRequested = true;
          return cb();
        })
        .catch(() => {
          self._accountsRequested = true;
          return cb();
        });
    });
  };

  tronWrap._getContract = async function (address, callback) {
    const contractInstance = await tronWrap.trx.getContract(address || '');
    if (contractInstance) {
      callback && callback(null, contractInstance.contract_address);
    } else {
      callback && callback(new Error('no code'));
    }
  };

  tronWrap._deployContract = function (option, callback) {
    if (extraOptions.evm) return tronWrap._evmDeployContract(option, callback);

    const myContract = this.contract();
    const originEnergyLimit = option.originEnergyLimit || this.networkConfig.originEnergyLimit;
    if (originEnergyLimit < 0 || originEnergyLimit > constants.deployParameters.originEnergyLimit) {
      throw new Error('Origin Energy Limit must be > 0 and <= 10,000,000');
    }

    const userFeePercentage =
      typeof options.userFeePercentage === 'number' ? options.userFeePercentage : this.networkConfig.userFeePercentage;

    const constructorAbi = option.abi.find(it => it.type === 'constructor');
    if (constructorAbi && option.parameters && option.parameters.length) {
      option.rawParameter = this.utils.abi.encodeParamsV2ByABI(constructorAbi, option.parameters);
    }

    this._new(
      myContract,
      {
        bytecode: option.data,
        feeLimit: option.feeLimit || this.networkConfig.feeLimit,
        callValue: option.callValue || this.networkConfig.callValue,
        userFeePercentage,
        originEnergyLimit,
        abi: option.abi,
        parameters: option.parameters,
        rawParameter: option.rawParameter,
        name: option.contractName,
        from: option.from || '',
        blockHeader: option.blockHeader
      },
      option.privateKey
    )
      .then(() => {
        callback(null, myContract);
        option.address = myContract.address;
      })
      .catch(function (reason) {
        callback(new Error(reason));
      });
  };

  tronWrap._new = async function (myContract, options, privateKey = tronWrap.defaultPrivateKey) {
    let signedTransaction;
    try {
      const address = options.from ? options.from : tronWrap.address.fromPrivateKey(privateKey);
      const transaction = await tronWrap.transactionBuilder.createSmartContract(options, address);
      if (tronWrap._treUnlockedAccounts[address]) {
        dlog('Unlocked account', { address });
        signedTransaction = transaction;
        transaction.signature = [];
      } else {
        signedTransaction = await tronWrap.trx.sign(transaction, privateKey);
      }
      const result = await tronWrap.trx.sendRawTransaction(signedTransaction);

      if (!result || typeof result !== 'object') {
        return Promise.reject(
          `Error while broadcasting the transaction to create the contract ${options.name}. Most likely, the creator has either insufficient bandwidth or energy.`
        );
      }

      if (result.code) {
        return Promise.reject(
          `${result.code} (${tronWrap.toUtf8(
            result.message
          )}) while broadcasting the transaction to create the contract ${options.name}`
        );
      }

      let contract;
      dlog('Contract broadcasted', {
        result: result.result,
        transaction_id: transaction.txID,
        address: transaction.contract_address
      });
      for (let i = 0; i < 10; i++) {
        try {
          dlog('Requesting contract');
          delete tronWrap.trx.cache.contracts[signedTransaction.contract_address];
          contract = await tronWrap.trx.getContract(signedTransaction.contract_address);
          dlog('Contract requested');
          if (contract.contract_address) {
            dlog('Contract found');
            break;
          }
        } catch (err) {
          dlog('Contract does not exist yet');
        }
        await sleep(500);
      }

      dlog('Reading contract data');

      if (!contract || !contract.contract_address) {
        throw new Error('Contract does not exist');
      }

      myContract.address = contract.contract_address;
      myContract.bytecode = contract.bytecode;
      myContract.deployed = true;

      myContract.loadAbi(JSON.parse(JSON.stringify(options.abi || [])));
      myContract.transactionHash = transaction.txID;

      dlog('Contract deployed:', options.name);
      return Promise.resolve(myContract);
    } catch (ex) {
      let e;
      if (ex.toString().includes('does not exist')) {
        const url = this.networkConfig.fullNode + '/wallet/gettransactionbyid?value=' + signedTransaction.txID;

        e =
          'Contract ' +
          chalk.bold(options.name) +
          ' has not been deployed on the network.\nFor more details, check the transaction at:\n' +
          chalk.blue(url) +
          '\nIf the transaction above is empty, most likely, your address had no bandwidth/energy to deploy the contract.';
      }

      return Promise.reject(e || ex);
    }
  };

  tronWrap._triggerContract = function (option, callback) {
    if (extraOptions.evm) return tronWrap._evmTriggerContract(option, callback);

    const myContract = this.contract(option.abi, option.address);
    let callSend = 'send'; // constructor and fallback
    const funAbi = tronWrap._findMethodAbi(option.methodName, option.abi);
    callSend = /payable/.test(funAbi.stateMutability) ? 'send' : 'call';
    option.methodArgs || (option.methodArgs = {});
    option.methodArgs.from || (option.methodArgs.from = this._accounts[0]);

    dlog(option.methodName, option.args, option.methodArgs);

    let privateKey;
    if (callSend === 'send' && option.methodArgs.from) {
      privateKey = this._privateKeyByAccount[option.methodArgs.from];
    }

    if (!option.methodArgs.feeLimit) {
      option.methodArgs.feeLimit = this.networkConfig.feeLimit;
    }

    this._getNetworkInfo()
      .then(info => {
        if (info.compilerVersion === '1') {
          delete option.methodArgs.tokenValue;
          delete option.methodArgs.tokenId;
        }
        const address = option.methodArgs.from;
        if (callSend === 'send' && tronWrap._treUnlockedAccounts[address]) {
          dlog('Unlocked account', { address });

          const { abi, functionSelector, defaultOptions } = myContract.methodInstances[option.methodName];
          const rawParameter = this.utils.abi.encodeParamsV2ByABI(abi, option.args);
          const { stateMutability } = abi;

          if (!['payable'].includes(stateMutability.toLowerCase())) {
            delete option.methodArgs.callValue;
            delete option.methodArgs.tokenId;
            delete option.methodArgs.tokenValue;
          }
          const options = {};
          Object.keys(defaultOptions).forEach(_ => {
            options[_] = defaultOptions[_];
          });
          Object.keys(option.methodArgs).forEach(_ => {
            options[_] = option.methodArgs[_];
          });
          options.rawParameter = rawParameter;

          return new Promise((resolve, reject) => {
            tronWrap.transactionBuilder
              .triggerSmartContract(option.address, functionSelector, options, [], address)
              .then(transaction => {
                if (!transaction.result || !transaction.result.result) {
                  return reject('Unknown error: ' + JSON.stringify(transaction, null, 2));
                }

                transaction.transaction.signature = [];
                tronWrap.trx
                  .sendRawTransaction(transaction.transaction)
                  .then(broadcast => {
                    if (broadcast.code) {
                      const err = {
                        error: broadcast.code,
                        message: broadcast.code
                      };
                      if (broadcast.message) {
                        err.message = tronWrap.toUtf8(broadcast.message);
                        err.error = tronWrap.toUtf8(broadcast.message);
                      }
                      return reject(err);
                    }

                    return resolve(transaction.transaction.txID);
                  })
                  .catch(err => {
                    return reject(err);
                  });
              })
              .catch(err => {
                return reject(err);
              });
          });
        }

        if (callSend === 'send' && !tronWrap._treUnlockedAccounts[address] && !privateKey) {
          return callback('sender account not recognized');
        }

        return myContract[option.methodName](...option.args)[callSend](option.methodArgs || {}, privateKey);
      })
      .then(function (res) {
        callback(null, res);
      })
      .catch(function (reason) {
        if (typeof reason === 'object' && reason.error) {
          reason = reason.error;
        }
        if (process.env.CURRENT === 'test') {
          callback(reason);
        } else {
          logErrorAndExit(console, reason);
        }
      });
  };

  tronWrap.request = async function (request = {}) {
    return tronWrap.send(request.method, request.params || []);
  };

  tronWrap.send = async function (method = '', params = []) {
    const _send = async () => {
      try {
        const { data } = await axios.post(this.networkConfig.fullNode + '/tre', {
          method,
          params,
          id: this._nextId++,
          jsonrpc: '2.0'
        });
        const { result, error } = data;
        if (result) return result;

        if (error) throw error.message ? error.message : error;
      } catch (error) {
        const err = error.message ? error.message : error;
        throw new Error(err);
      }
    };

    switch (method) {
      case 'tre_setAccountBalance':
      case 'tre_setAccountStorageAt':
      case 'tre_setAccountCode':
      case 'tre_mine':
      case 'tre_blockTime':
      case 'debug_traceTransaction':
      case 'debug_storageRangeAt':
        return _send();
      case 'tre_unlockedAccounts': {
        const result = await _send();
        if (result) {
          const accounts = params[0] || [];
          for (let i = 0; i < accounts.length; i++) {
            const address = accounts[i];
            if (tronWrap._tre) {
              const hexAddr = tronWrap.address.toHex(address);
              const base58Addr = tronWrap.address.fromHex(address);
              tronWrap._treUnlockedAccounts[hexAddr] = true;
              tronWrap._treUnlockedAccounts[base58Addr] = true;
            }
          }
        }
        return result;
      }
      default:
        return _send();
    }
  };

  tronWrap.fullNode._request = tronWrap.fullNode.request;
  tronWrap.solidityNode._request = tronWrap.solidityNode.request;
  tronWrap._getConsoleLog = function (url, transaction) {
    const urls = [
      'wallet/triggerconstantcontract',
      'walletsolidity/triggerconstantcontract',
      'wallet/broadcasttransaction'
    ];
    if (urls.includes(url)) {
      ConsoleLogger.getLogMessages(transaction, extraOptions.logger);
    }
  };

  tronWrap.fullNode.request = function (url, payload = {}, method = 'get') {
    return tronWrap.fullNode._request(url, payload, method).then(data => {
      tronWrap._getConsoleLog(url, data);
      return data;
    });
  };

  tronWrap.solidityNode.request = function (url, payload = {}, method = 'get') {
    return tronWrap.solidityNode._request(url, payload, method).then(data => {
      tronWrap._getConsoleLog(url, data);
      return data;
    });
  };

  tronWrap._evmGetAccounts = async function (callback) {
    const accounts = [...tronWrap._ethers_accounts];
    tronWrap._privateKeyByAccount[accounts[0]] = tronWrap._ethers_wallets[accounts[0]].privateKey;
    if (callback) {
      return callback(null, accounts);
    }
    return accounts;
  };

  tronWrap._evmDeployContract = async function (option, callback) {
    const opt = {
      from: option.from || tronWrap._ethers_accounts[0],
      gas: option.gas || option.gasLimit || this.networkConfig.gas,
      gasPrice: option.gasPrice || this.networkConfig.gasPrice,
      maxPriorityFeePerGas: option.maxPriorityFeePerGas || this.networkConfig.maxPriorityFeePerGas,
      maxFeePerGas: option.maxFeePerGas || this.networkConfig.maxFeePerGas,
      value: option.value || option.callValue || option.call_value,
      nonce: option.nonce,
      type: option.type
    };

    if (opt.maxPriorityFeePerGas || opt.maxFeePerGas) {
      delete opt.gasPrice;
    }

    Object.keys(opt).forEach(key => {
      if (opt[key] === undefined || opt[key] === null) {
        delete opt[key];
      }
    });

    try {
      dlog('Deploying contract:', option.contractName);
      if (opt.nonce === undefined) {
        opt.nonce = await tronWrap._evmGetNonce(opt.from);
      }
      const wallet = tronWrap._ethers_wallets[opt.from];
      const factory = new ethers.ContractFactory(option.abi, option.data, wallet);
      const constructorArgs = option.parameters || [];
      const deployedContract = await factory.deploy(...constructorArgs, opt);
      const deploymentTx = deployedContract.deploymentTransaction();
      if (!deploymentTx) {
        return callback(new Error('Failed to get deployment transaction'));
      }

      const transactionHash = deploymentTx.hash;
      const address = await deployedContract.getAddress();

      dlog('Contract broadcasted', {
        address,
        transactionHash
      });

      const receipt = await deploymentTx.wait();
      if (!receipt || !receipt.status) {
        const statusMsg = receipt ? `status code: ${receipt.status}` : 'no receipt';
        return callback(new Error(`Contract deployment failed (${statusMsg})`));
      }

      dlog('Contract deployed:', option.contractName);
      callback(null, {
        address,
        transactionHash
      });
    } catch (error) {
      callback(error);
    }
  };

  tronWrap._evmTriggerContract = async function (option, callback) {
    const { methodArgs } = option;
    const opt = {
      from: methodArgs.from || tronWrap._ethers_accounts[0],
      gas: methodArgs.gas || methodArgs.gasLimit || this.networkConfig.gas,
      gasPrice: methodArgs.gasPrice || this.networkConfig.gasPrice,
      maxPriorityFeePerGas: methodArgs.maxPriorityFeePerGas || this.networkConfig.maxPriorityFeePerGas,
      maxFeePerGas: methodArgs.maxFeePerGas || this.networkConfig.maxFeePerGas,
      value: methodArgs.value || methodArgs.callValue || methodArgs.call_value,
      nonce: methodArgs.nonce,
      type: methodArgs.type
    };

    if (opt.maxPriorityFeePerGas || opt.maxFeePerGas) {
      delete opt.gasPrice;
    }

    Object.keys(opt).forEach(key => {
      if (opt[key] === undefined || opt[key] === null) {
        delete opt[key];
      }
    });

    let callSend = 'send';
    const funAbi = tronWrap._findMethodAbi(option.methodName, option.abi);
    callSend = /payable/.test(funAbi.stateMutability) ? 'send' : 'call';

    try {
      if (opt.nonce === undefined) {
        opt.nonce = await tronWrap._evmGetNonce(opt.from);
      }
      const wallet = tronWrap._ethers_wallets[opt.from];
      const contract = new ethers.Contract(option.address, option.abi, wallet);
      const methodArgs = option.args || [];
      const methodFunc = contract[option.methodName];

      if (callSend === 'call') {
        const callRes = await methodFunc.staticCall(...methodArgs, opt);
        return callback(null, callRes);
      }

      dlog('Sending transaction');
      const tx = await methodFunc.send(...methodArgs, opt);
      const transactionHash = tx.hash;
      dlog('Transaction sent');

      const receipt = await tx.wait();
      if (!receipt || !receipt.status) {
        const statusMsg = receipt ? `status code: ${receipt.status}` : 'no receipt';
        return callback(new Error(`Transaction failed (${statusMsg})`));
      }
      callback(null, transactionHash);
    } catch (error) {
      callback(error);
    }
  };

  tronWrap._evmGetNonce = async function (address) {
    try {
      const provider = tronWrap._ethers.provider;
      return await provider.send('eth_getTransactionCount', [address, 'pending']);
    } catch (error) {
      throw error;
    }
  };

  return new TronWrap();
}

const logErrorAndExit = (logger, err) => {
  function log(str) {
    try {
      logger.error(str);
    } catch (err) {
      console.error(str);
    }
  }

  let msg = typeof err === 'string' ? err : err.message;
  if (msg) {
    msg = msg.replace(/^error(:|) /i, '');
    if (msg === 'Invalid URL provided to HttpProvider') {
      msg = 'Either invalid or wrong URL provided to HttpProvider. Verify the node URLs in your project configuration.';
    }
    log(chalk.red(chalk.bold('ERROR:'), msg));
  } else {
    log('Error encountered, bailing. Network state unknown.');
  }
  process.exit(1);
};

const dlog = function (...args) {
  if (process.env.DEBUG_MODE) {
    for (let i = 0; i < args.length; i++) {
      if (typeof args[i] === 'object') {
        try {
          args[i] = JSON.stringify(args[i], null, 2);
        } catch (err) {}
      }
    }
    console.debug(chalk.blue(args.join(' ')));
  }
};

module.exports = init;

module.exports.config = () => console.info('config');
module.exports.constants = constants;
module.exports.logErrorAndExit = logErrorAndExit;
module.exports.dlog = dlog;
module.exports.sleep = sleep;
module.exports.TronWeb = _TronWeb;
