const { ethers } = require('ethers');
const { TronWeb } = require('tronweb');
const chalk = require('chalk');
const axios = require('axios');
const constants = require('./constants');
const ConsoleLogger = require('../ConsoleLogger');
const { TronWebProxy } = require('./TronWebProxy');
const { EthersSignerProxy } = require('./EthersProxy');

let instance;
let privateKeyByAccount = {};
let ethersWallets = {};

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

function isLocalHostname(hostname = '') {
  const normalizedHostname = String(hostname).toLowerCase();
  return normalizedHostname === 'localhost' || normalizedHostname === '127.0.0.1' || normalizedHostname === '[::1]';
}

function isLocalNode(url) {
  try {
    const { hostname } = new URL(url);
    return isLocalHostname(hostname);
  } catch {
    return false;
  }
}

function validateNodeUrl(nodeUrl, configKey = 'node URL', logger = {}) {
  if (!nodeUrl || typeof nodeUrl !== 'string') return;

  let parsedUrl;
  try {
    parsedUrl = new URL(nodeUrl);
  } catch (error) {
    throw new Error(`${configKey} must be a valid URL.`);
  }

  const protocol = parsedUrl.protocol;
  if (protocol !== 'http:' && protocol !== 'https:') {
    throw new Error(`${configKey} must use http or https protocol.`);
  }

  if (protocol === 'http:' && !isLocalHostname(parsedUrl.hostname)) {
    logger?.log?.(
      chalk.yellow('WARNING:'),
      `${configKey} is using http for a non-local URL. It's recommended to use https for security reasons.\n`
    );
  }
}

function resolveDeployAssetOption(txOptions, networkConfig, key) {
  if (Object.prototype.hasOwnProperty.call(txOptions, key)) {
    return txOptions[key];
  }
  return networkConfig[key];
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

    // Validate node URLs
    const nodeUrlConfigKeys = ['fullHost', 'fullNode', 'solidityNode', 'eventServer'];
    nodeUrlConfigKeys.forEach(configKey => {
      validateNodeUrl(options[configKey], configKey, extraOptions.logger);
    });
  }

  const getPrivateKey = () => {
    const privateKey = options.mnemonic
      ? TronWeb.fromMnemonic(options.mnemonic, options.path).privateKey
      : options.privateKey;

    if (typeof privateKey !== 'string' || !privateKey) {
      throw new Error('Invalid privateKey. Expected a non-empty string.');
    }

    return privateKey.replace(/^0x/, '');
  };

  const tronWrap = new TronWebProxy(
    options.fullNode || options.fullHost,
    options.solidityNode || options.fullHost,
    options.eventServer || options.fullHost,
    getPrivateKey()
  );

  tronWrap.EventList = [];
  tronWrap.filterMatchFunction = filterMatchFunction;

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
    tronWrap._ethers_accounts = [wallet.address];
    ethersWallets = { [wallet.address]: wallet };
    tronWrap._ethers = {
      ...ethers,
      provider,
      getSigner: address => EthersSignerProxy(ethersWallets[address]),
      getSigners: () => Object.values(ethersWallets).map(EthersSignerProxy)
    };
  }

  tronWrap._getNetwork = function (callback) {
    callback && callback(null, options.network_id);
  };

  const defaultAddress = tronWrap.defaultAddress.base58;
  tronWrap._accounts = [defaultAddress];
  privateKeyByAccount[defaultAddress] = getPrivateKey();

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
            privateKeyByAccount = {};
            for (const pk of data) {
              const address = self.address.fromPrivateKey(pk);
              privateKeyByAccount[address] = pk;
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

  tronWrap._deployContract = function (txOptions, callback) {
    if (extraOptions.evm) return tronWrap._evmDeployContract(txOptions, callback);

    const myContract = this.contract();
    const originEnergyLimit = txOptions.originEnergyLimit || this.networkConfig.originEnergyLimit;
    if (originEnergyLimit <= 0) {
      throw new Error('Origin Energy Limit must be > 0');
    }

    const userFeePercentage =
      typeof txOptions.userFeePercentage === 'number'
        ? txOptions.userFeePercentage
        : this.networkConfig.userFeePercentage;

    const constructorAbi = txOptions.abi.find(it => it.type === 'constructor');
    if (constructorAbi && txOptions.parameters && txOptions.parameters.length) {
      txOptions.rawParameter = this.utils.abi.encodeParamsV2ByABI(constructorAbi, txOptions.parameters);
    }

    this._new(
      myContract,
      {
        bytecode: txOptions.data,
        feeLimit: txOptions.feeLimit || this.networkConfig.feeLimit,
        callValue: resolveDeployAssetOption(txOptions, this.networkConfig, 'callValue'),
        tokenId: resolveDeployAssetOption(txOptions, this.networkConfig, 'tokenId'),
        tokenValue: resolveDeployAssetOption(txOptions, this.networkConfig, 'tokenValue'),
        userFeePercentage,
        originEnergyLimit,
        abi: txOptions.abi,
        parameters: txOptions.parameters,
        rawParameter: txOptions.rawParameter,
        name: txOptions.contractName,
        from: txOptions.from || '',
        blockHeader: txOptions.blockHeader
      },
      txOptions.privateKey
    )
      .then(() => {
        callback(null, myContract);
        txOptions.address = myContract.address;
      })
      .catch(function (reason) {
        callback(new Error(reason));
      });
  };

  tronWrap._new = async function (myContract, txOptions, _privateKey) {
    let signedTransaction;
    try {
      const address = txOptions.from ? txOptions.from : tronWrap._accounts[0];
      const transaction = await tronWrap.transactionBuilder.createSmartContract(txOptions, address);
      if (tronWrap._treUnlockedAccounts[address]) {
        dlog('Unlocked account', { address });
        signedTransaction = transaction;
        transaction.signature = [];
      } else {
        const privateKey = privateKeyByAccount[address];
        if (!privateKey) {
          throw new Error(`No private key available for from address ${address}. `);
        }
        signedTransaction = await tronWrap.trx.sign(transaction, privateKey);
      }
      const result = await tronWrap.trx.sendRawTransaction(signedTransaction);

      if (!result || typeof result !== 'object') {
        return Promise.reject(
          `Error while broadcasting the transaction to create the contract ${txOptions.name}. Most likely, the creator has either insufficient bandwidth or energy.`
        );
      }

      if (result.code) {
        return Promise.reject(
          `${result.code} (${tronWrap.toUtf8(
            result.message
          )}) while broadcasting the transaction to create the contract ${txOptions.name}`
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

      const expectedAddress = tronWrap.address.toHex(signedTransaction.contract_address);
      const actualAddress = tronWrap.address.toHex(contract.contract_address);

      if (actualAddress !== expectedAddress) {
        throw new Error(
          `Contract address mismatch: expected ${expectedAddress}, got ${actualAddress}. ` +
            `Transaction: ${signedTransaction.txID}`
        );
      }

      myContract.address = expectedAddress;
      myContract.bytecode = contract.bytecode;
      myContract.deployed = true;

      myContract.loadAbi(JSON.parse(JSON.stringify(txOptions.abi || [])));
      myContract.transactionHash = transaction.txID;

      dlog('Contract deployed:', txOptions.name);
      return Promise.resolve(myContract);
    } catch (ex) {
      let e;
      if (ex.toString().includes('does not exist')) {
        const url = this.networkConfig.fullNode + '/wallet/gettransactionbyid?value=' + signedTransaction.txID;

        e =
          'Contract ' +
          chalk.bold(txOptions.name) +
          ' has not been deployed on the network.\nFor more details, check the transaction at:\n' +
          chalk.blue(url) +
          '\nIf the transaction above is empty, most likely, your address had no bandwidth/energy to deploy the contract.';
      }

      return Promise.reject(e || ex);
    }
  };

  tronWrap._triggerContract = async function (txOptions, callback) {
    if (extraOptions.evm) return tronWrap._evmTriggerContract(txOptions, callback);

    try {
      const myContract = this.contract(txOptions.abi, txOptions.address);
      const funAbi = tronWrap._findMethodAbi(txOptions.methodName, txOptions.abi);
      const callSend = /payable/.test(funAbi.stateMutability) ? 'send' : 'call';
      txOptions.methodArgs || (txOptions.methodArgs = {});
      txOptions.methodArgs.from || (txOptions.methodArgs.from = this._accounts[0]);

      dlog(txOptions.methodName, txOptions.args, txOptions.methodArgs);

      const address = txOptions.methodArgs.from;
      const privateKey = callSend === 'send' && address ? privateKeyByAccount[address] : undefined;

      if (!txOptions.methodArgs.feeLimit) {
        txOptions.methodArgs.feeLimit = this.networkConfig.feeLimit;
      }

      if (callSend === 'send' && tronWrap._treUnlockedAccounts[address]) {
        dlog('Unlocked account', { address });

        const { abi, functionSelector, defaultOptions } = myContract.methodInstances[txOptions.methodName];
        const rawParameter = this.utils.abi.encodeParamsV2ByABI(abi, txOptions.args);
        const { stateMutability } = abi;

        if (!['payable'].includes(stateMutability.toLowerCase())) {
          delete txOptions.methodArgs.callValue;
          delete txOptions.methodArgs.tokenId;
          delete txOptions.methodArgs.tokenValue;
        }

        const triggerOptions = { ...defaultOptions, ...txOptions.methodArgs, rawParameter };

        const transaction = await tronWrap.transactionBuilder.triggerSmartContract(
          txOptions.address,
          functionSelector,
          triggerOptions,
          [],
          address
        );
        if (!transaction.result || !transaction.result.result) {
          throw 'Unknown error: ' + JSON.stringify(transaction, null, 2);
        }
        transaction.transaction.signature = [];
        const broadcast = await tronWrap.trx.sendRawTransaction(transaction.transaction);
        if (broadcast.code) {
          const err = { error: broadcast.code, message: broadcast.code };
          if (broadcast.message) {
            err.message = tronWrap.toUtf8(broadcast.message);
            err.error = tronWrap.toUtf8(broadcast.message);
          }
          throw err;
        }
        return callback(null, transaction.transaction.txID);
      }

      if (callSend === 'send' && !privateKey) {
        return callback(`No private key available for from address ${address}. `);
      }

      const res = await myContract[txOptions.methodName](...txOptions.args)[callSend](
        txOptions.methodArgs || {},
        privateKey
      );
      callback(null, res);
    } catch (reason) {
      if (reason && typeof reason.message === 'string') {
        reason.message = reason.message.replace(/^error:\s*/i, '');
      }
      callback(reason);
    }
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
        throw new Error(`TRE RPC '${method}': ${err}`);
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
    privateKeyByAccount[accounts[0]] = ethersWallets[accounts[0]].privateKey;
    if (callback) {
      return callback(null, accounts);
    }
    return accounts;
  };

  tronWrap._evmDeployContract = async function (txOptions, callback) {
    const opt = {
      from: txOptions.from || tronWrap._ethers_accounts[0],
      gasLimit: txOptions.gas || txOptions.gasLimit || this.networkConfig.gas,
      gasPrice: txOptions.gasPrice || this.networkConfig.gasPrice,
      maxPriorityFeePerGas: txOptions.maxPriorityFeePerGas || this.networkConfig.maxPriorityFeePerGas,
      maxFeePerGas: txOptions.maxFeePerGas || this.networkConfig.maxFeePerGas,
      value: txOptions.value || txOptions.callValue || txOptions.call_value,
      nonce: txOptions.nonce,
      type: txOptions.type
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
      dlog('Deploying contract:', txOptions.contractName);
      if (opt.nonce === undefined) {
        opt.nonce = await tronWrap._evmGetNonce(opt.from);
      }
      const wallet = ethersWallets[opt.from];
      const factory = new ethers.ContractFactory(txOptions.abi, txOptions.data, wallet);
      const constructorArgs = txOptions.parameters || [];
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

      dlog('Contract deployed:', txOptions.contractName);
      callback(null, {
        address,
        transactionHash
      });
    } catch (error) {
      callback(error);
    }
  };

  tronWrap._evmTriggerContract = async function (txOptions, callback) {
    const { methodArgs } = txOptions;
    const opt = {
      from: methodArgs.from || tronWrap._ethers_accounts[0],
      gasLimit: methodArgs.gas || methodArgs.gasLimit || this.networkConfig.gas,
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
    const funAbi = tronWrap._findMethodAbi(txOptions.methodName, txOptions.abi);
    callSend = /payable/.test(funAbi.stateMutability) ? 'send' : 'call';

    try {
      if (opt.nonce === undefined) {
        opt.nonce = await tronWrap._evmGetNonce(opt.from);
      }
      const wallet = ethersWallets[opt.from];
      const contract = new ethers.Contract(txOptions.address, txOptions.abi, wallet);
      const callArgs = txOptions.args || [];
      const methodFunc = contract[txOptions.methodName];

      if (callSend === 'call') {
        const callRes = await methodFunc.staticCall(...callArgs, opt);
        return callback(null, callRes);
      }

      dlog('Sending transaction');
      const tx = await methodFunc.send(...callArgs, opt);
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

  instance = tronWrap;
  return instance;
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
module.exports.TronWeb = TronWeb;
