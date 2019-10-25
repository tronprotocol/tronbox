var ethJSABI = require('ethjs-abi')
var TronWrap = require('../TronWrap')
var {constants} = require('../TronWrap')
var BigNumber = require('bignumber.js')
var StatusError = require('./statuserror.js')

// eslint-disable-next-line no-unused-vars
var contract = (function (module) {

  // Planned for future features, logging, etc.
  function Provider(provider) {
    this.provider = provider
  }

  let tronWrap

  Provider.prototype.send = function () {
    return this.provider.send.apply(this.provider, arguments)
  }

  Provider.prototype.sendAsync = function () {
    return this.provider.sendAsync.apply(this.provider, arguments)
  }

  var Utils = {
    is_object: function (val) {
      return typeof val == 'object' && !Array.isArray(val)
    },
    is_big_number: function (val) {
      if (typeof val != 'object') return false

      // Instanceof won't work because we have multiple versions of Web3.
      try {
        new BigNumber(val)
        return true
      } catch (e) {
        return false
      }
    },
    decodeLogs: function (C, instance, logs) {
      return logs.map(function (log) {
        var logABI = C.events[log.topics[0]]

        if (logABI == null) {
          return null
        }

        // This function has been adapted from web3's SolidityEvent.decode() method,
        // and built to work with ethjs-abi.

        var copy = Utils.merge({}, log)

        function partialABI(fullABI, indexed) {
          var inputs = fullABI.inputs.filter(function (i) {
            return i.indexed === indexed
          })

          var partial = {
            inputs: inputs,
            name: fullABI.name,
            type: fullABI.type,
            anonymous: fullABI.anonymous
          }

          return partial
        }

        var argTopics = logABI.anonymous ? copy.topics : copy.topics.slice(1)
        var indexedData = '0x' + argTopics.map(function (topics) {
          return topics.slice(2)
        }).join('')
        var indexedParams = ethJSABI.decodeEvent(partialABI(logABI, true), indexedData)

        var notIndexedData = copy.data
        var notIndexedParams = ethJSABI.decodeEvent(partialABI(logABI, false), notIndexedData)

        copy.event = logABI.name

        copy.args = logABI.inputs.reduce(function (acc, current) {
          var val = indexedParams[current.name]

          if (val === undefined) {
            val = notIndexedParams[current.name]
          }

          acc[current.name] = val
          return acc
        }, {})

        Object.keys(copy.args).forEach(function (key) {
          var val = copy.args[key]

          // We have BN. Convert it to BigNumber
          if (val.constructor.isBN) {
            copy.args[key] = BigNumber('0x' + val.toString(16))
          }
        })

        delete copy.data
        delete copy.topics

        return copy
      }).filter(function (log) {
        return log != null
      })
    },
    promisifyFunction: function (fn, C) {
      return function () {
        var instance = this

        var args = Array.prototype.slice.call(arguments)
        var tx_params = {}
        var last_arg = args[args.length - 1]

        // It's only tx_params if it's an object and not a BigNumber.
        if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
          tx_params = args.pop()
        }

        tx_params = Utils.merge(C.class_defaults, tx_params)

        return new Promise(function (accept, reject) {
          var callback = function (error, result) {
            if (error != null) {
              reject(error)
            } else {
              accept(result)
            }
          }
          args.push(tx_params, callback)
          fn.apply(instance.contract, args)
        })
      }
    },
    synchronizeFunction: function (fn, instance, C) {
      var self = this
      return function () {
        var args = Array.prototype.slice.call(arguments)
        var tx_params = {}
        var last_arg = args[args.length - 1]

        // It's only tx_params if it's an object and not a BigNumber.
        if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
          tx_params = args.pop()
        }

        tx_params = Utils.merge(C.class_defaults, tx_params)

        return new Promise(function (accept, reject) {
          var callback = function (error, tx) {
            if (error != null) {
              reject(error)
              return
            }

            var timeout
            if (C.synchronization_timeout === 0 || C.synchronization_timeout !== undefined) {
              timeout = C.synchronization_timeout
            } else {
              timeout = 240000
            }

            var start = new Date().getTime()

            var make_attempt = function () {
              C.web3.eth.getTransactionReceipt(tx, function (err, receipt) {
                if (err && !err.toString().includes('unknown transaction')) {
                  return reject(err)
                }

                // Reject on transaction failures, accept otherwise
                // Handles "0x00" or hex 0
                if (receipt != null) {
                  if (parseInt(receipt.status, 16) == 0) {
                    var statusError = new StatusError(tx_params, tx, receipt)
                    return reject(statusError)
                  } else {
                    return accept({
                      tx: tx,
                      receipt: receipt,
                      logs: Utils.decodeLogs(C, instance, receipt.logs)
                    })
                  }
                }

                if (timeout > 0 && new Date().getTime() - start > timeout) {
                  return reject(new Error('Transaction ' + tx + " wasn't processed in " + (timeout / 1000) + ' seconds!'))
                }

                setTimeout(make_attempt, 1000)
              })
            }

            make_attempt()
          }

          args.push(tx_params, callback)
          fn.apply(self, args)
        })
      }
    },
    merge: function () {
      var merged = {}
      var args = Array.prototype.slice.call(arguments)

      for (var i = 0; i < args.length; i++) {
        var object = args[i]
        var keys = Object.keys(object)
        for (var j = 0; j < keys.length; j++) {
          var key = keys[j]
          var value = object[key]
          merged[key] = value
        }
      }

      return merged
    },
    parallel: function (arr, callback) {
      callback = callback || function () {
      }
      if (!arr.length) {
        return callback(null, [])
      }
      var index = 0
      var results = new Array(arr.length)
      arr.forEach(function (fn, position) {
        fn(function (err, result) {
          if (err) {
            callback(err)
            callback = function () {
            }
          } else {
            index++
            results[position] = result
            if (index >= arr.length) {
              callback(null, results)
            }
          }
        })
      })
    },
    bootstrap: function (fn) {
      // Add our static methods
      Object.keys(fn._static_methods).forEach(function (key) {
        fn[key] = fn._static_methods[key].bind(fn)
      })

      // Add our properties.
      Object.keys(fn._properties).forEach(function (key) {
        fn.addProp(key, fn._properties[key])
      })

      return fn
    },
    linkBytecode: function (bytecode, links) {
      Object.keys(links).forEach(function (library_name) {
        var library_address = links[library_name]
        var regex = new RegExp('__' + library_name + '_+', 'g')
        bytecode = bytecode.replace(regex, library_address.replace('0x', '').replace('41', ''))
        // var address = TronWrap.address2HexString(library_address);
        // bytecode = bytecode.replace(eval('/'+library_address+"/ig"),address.replace("41", ""));
      })

      return bytecode
    }
  }

  function Contract(contract) {
    var constructor = this.constructor
    this.abi = constructor.abi
    if (typeof contract == 'string') {
      this.address = contract
    } else {
      this.allEvents = contract.allEvents
      this.contract = contract
      this.address = contract.address
    }
  }

  function toCamelCase(str) {
    return str.replace(/_([a-z])/g, g => g[1].toUpperCase())
  }

  function filterEnergyParameter(args) {
    let deployParameters = Object.keys(constants.deployParameters)
    let lastArg = args[args.length - 1]
    if (typeof lastArg !== 'object' || Array.isArray(lastArg)) return [args, {}]
    args.pop()
    let res = {}
    for (let property in lastArg) {
      let camelCased = toCamelCase(property)
      if (~deployParameters.indexOf(camelCased)) {
        res[camelCased] = lastArg[property]
      }
    }
    return [args, res]
  }

  Contract._static_methods = {

    initTronWeb: function (options) {
      if (!tronWrap) {
        tronWrap = TronWrap(options)
      }
    },

    setProvider: function (provider) {
      if (!provider) {
        throw new Error('Invalid provider passed to setProvider(); provider is ' + provider)
      }

      this.currentProvider = provider
    },

    new: function () {
      var self = this

      if (this.currentProvider == null) {
        throw new Error(this.contractName + ' error: Please call setProvider() first before calling new().')
      }

      var [args, params] = filterEnergyParameter(Array.prototype.slice.call(arguments))

      if (!this.bytecode) {
        throw new Error(this._json.contractName + " error: contract binary not set. Can't deploy new instance.")
      }

      // After the network is set, check to make sure everything's ship shape.
      var regex = /__[^_]+_+/g
      var unlinked_libraries = self.binary.match(regex)

      if (unlinked_libraries != null) {
        unlinked_libraries = unlinked_libraries.map(function (name) {
          // Remove underscores
          return name.replace(/_/g, '')
        }).sort().filter(function (name, index, arr) {
          // Remove duplicates
          if (index + 1 >= arr.length) {
            return true
          }

          return name != arr[index + 1]
        }).join(', ')

        throw new Error(self.contractName + ' contains unresolved libraries. You must deploy and link the following libraries before you can deploy a new version of ' + self._json.contractName + ': ' + unlinked_libraries)
      }
      return new Promise(function (accept, reject) {
        // var contract_class = self.web3.eth.contract(self.abi);
        var tx_params = {
          parameters: args
        }
        var last_arg = args[args.length - 1]

        // It's only tx_params if it's an object and not a BigNumber.
        if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
          tx_params = args.pop()
        }

        // Validate constructor args
        var constructor = self.abi.filter(function (item) {
          return item.type === 'constructor'
        })

        if (constructor.length && constructor[0].inputs.length !== args.length) {
          throw new Error(self.contractName + ' contract constructor expected ' + constructor[0].inputs.length + ' arguments, received ' + args.length)
        }
        tx_params = Utils.merge(self.class_defaults, tx_params)

        if (tx_params.data == null) {
          tx_params.data = self.binary
        }

        // for debugging only:
        tx_params.contractName = self.contractName

        for (let param in params) {
          tx_params[param] = params[param]
        }

        tx_params.abi = self.abi

        tronWrap._deployContract(tx_params, _callback)

        function _callback(err, res) {
          if (err) {
            reject(err)
            return
          }
          accept(new self(res.address))
        }
      })
    },

    at: function () {

      throw new Error('The construct contractArtifacts.at(address) is not currently supported by TronBox. It will be in the future. Stay in touch.')

    },
    call: function (methodName, ...args) {

      var self = this
      var methodArgs = {}


      var lastArg = args[args.length - 1]
      if (!Array.isArray(lastArg) && typeof lastArg === 'object') {
        methodArgs = args.pop()
      }

      if (!methodArgs.call_value) {
        methodArgs.call_value = 0
      }

      if (Array.isArray(args[0])) {
        if (Array.isArray(args[0][0])) {
          args = args[0]
        } else {
          for (let item of self.abi) {
            if (item.name === methodName) {
              if (!/\[\]$/.test(item.inputs[0].type)) {
                args = args[0]
              }
            }
          }
        }
      }

      var option = {}

      return new Promise(function (accept, reject) {
        function _callback(err, res) {
          if (err) {
            reject(err)
            return
          }
          accept(res)
        }

        option = Utils.merge({
          address: self.address,
          methodName,
          args,
          abi: self.abi,
          methodArgs
        }, self.defaults())

        tronWrap.triggerContract(option, _callback)
      })
    },
    deployed: function () {
      var self = this
      return new Promise(function (accept, reject) {
        // If we found the network but it's not deployed
        if (!self.isDeployed()) {
          throw new Error(self.contractName + ' has not been deployed to detected network')
        }
        TronWrap().trx.getContract(self.address)
          .then(res => {
            const abi = res.abi && res.abi.entrys ? res.abi.entrys : []
            for (var i = 0; i < abi.length; i++) {
              let item = abi[i]
              // eslint-disable-next-line no-prototype-builtins
              if (self.hasOwnProperty(item.name)) continue
              if (/(function|event)/i.test(item.type) && item.name) {
                let f = (...args) => {
                  return self.call.apply(null, [item.name].concat(args))
                }
                self[item.name] = f
                self[item.name].call = f
              }
            }
            accept(self)
          })
          .catch(err => {
            reject(err)
          })
      })
    },

    defaults: function (class_defaults) {
      if (this.class_defaults == null) {
        this.class_defaults = {}
      }

      if (class_defaults == null) {
        class_defaults = {}
      }

      var self = this
      Object.keys(class_defaults).forEach(function (key) {
        var value = class_defaults[key]
        self.class_defaults[key] = value
      })

      return this.class_defaults
    },

    hasNetwork: function (network_id) {
      return this._json.networks[network_id + ''] != null
    },

    isDeployed: function () {
      if (this.network_id == null) {
        return false
      }

      if (this._json.networks[this.network_id] == null) {
        return false
      }

      return !!this.network.address
    },
    setNetwork: function (network_id) {
      if (!network_id) return
      this.network_id = network_id + ''
    },

    // Overrides the deployed address to null.
    // You must call this explicitly so you don't inadvertently do this otherwise.
    resetAddress: function () {
      delete this.network.address
    },

    link: function (name, address) {
      var self = this

      if (typeof name == 'function') {
        var contract = name

        if (contract.isDeployed() == false) {
          throw new Error('Cannot link contract without an address.')
        }

        this.link(contract.contractName, contract.address)

        // Merge events so this contract knows about library's events
        Object.keys(contract.events).forEach(function (topic) {
          self.network.events[topic] = contract.events[topic]
        })

        return
      }

      if (typeof name == 'object') {
        var obj = name
        Object.keys(obj).forEach(function (name) {
          var a = obj[name]
          self.link(name, a)
        })
        return
      }

      if (this._json.networks[this.network_id] == null) {
        this._json.networks[this.network_id] = {
          events: {},
          links: {}
        }
      }

      this.network.links[name] = address
    },

    // Note, this function can be called with two input types:
    // 1. Object with a bunch of data; this data will be merged with the json data of contract being cloned.
    // 2. network id; this will clone the contract and set a specific network id upon cloning.
    clone: function (json) {
      var self = this

      json = json || {}

      var temp = function TruffleContract() {
        this.constructor = temp
        return Contract.apply(this, arguments)
      }

      temp.prototype = Object.create(self.prototype)

      var network_id

      // If we have a network id passed
      if (typeof json != 'object') {
        network_id = json
        json = self._json
      }

      json = Utils.merge({}, self._json || {}, json)

      temp._static_methods = this._static_methods
      temp._properties = this._properties

      temp._property_values = {}
      temp._json = json

      Utils.bootstrap(temp)

      temp.class_defaults = temp.prototype.defaults || {}

      if (network_id) {
        temp.setNetwork(network_id)
      }

      // Copy over custom key/values to the contract class
      Object.keys(json).forEach(function (key) {
        if (key.indexOf('x-') != 0) return
        temp[key] = json[key]
      })

      return temp
    },

    addProp: function (key, fn) {
      var self = this

      var getter = function () {
        if (fn.get != null) {
          return fn.get.call(self)
        }

        return self._property_values[key] || fn.call(self)
      }
      var setter = function (val) {
        if (fn.set != null) {
          fn.set.call(self, val)
          return
        }

        // If there's not a setter, then the property is immutable.
        throw new Error(key + ' property is immutable')
      }

      var definition = {}
      definition.enumerable = false
      definition.configurable = false
      definition.get = getter
      definition.set = setter

      Object.defineProperty(this, key, definition)
    },

    toJSON: function () {
      return this._json
    }
  }

  // Getter functions are scoped to Contract object.
  Contract._properties = {
    contract_name: {
      get: function () {
        return this.contractName
      },
      set: function (val) {
        this.contractName = val
      }
    },
    contractName: {
      get: function () {
        return this._json.contractName || 'Contract'
      },
      set: function (val) {
        this._json.contractName = val
      }
    },
    abi: {
      get: function () {
        return this._json.abi
      },
      set: function (val) {
        this._json.abi = val
      }
    },
    network: function () {
      var network_id = this.network_id

      if (network_id == null) {
        throw new Error(this.contractName + ' has no network id set, cannot lookup artifact data. Either set the network manually using ' + this.contractName + '.setNetwork(), run ' + this.contractName + '.detectNetwork(), or use new(), at() or deployed() as a thenable which will detect the network automatically.')
      }

      // TODO: this might be bad; setting a value on a get.
      if (this._json.networks[network_id] == null) {
        throw new Error(this.contractName + ' has no network configuration for its current network id (' + network_id + ').')
      }

      var returnVal = this._json.networks[network_id]

      // Normalize output
      if (returnVal.links == null) {
        returnVal.links = {}
      }

      if (returnVal.events == null) {
        returnVal.events = {}
      }

      return returnVal
    },
    networks: function () {
      return this._json.networks
    },
    address: {
      get: function () {
        var address = this.network.address

        if (address == null) {
          throw new Error('Cannot find deployed address: ' + this.contractName + ' not deployed or address not set.')
        }

        return address
      },
      set: function (val) {
        if (val == null) {
          throw new Error('Cannot set deployed address; malformed value: ' + val)
        }

        var network_id = this.network_id

        if (network_id == null) {
          throw new Error(this.contractName + ' has no network id set, cannot lookup artifact data. Either set the network manually using ' + this.contractName + '.setNetwork(), run ' + this.contractName + '.detectNetwork(), or use new(), at() or deployed() as a thenable which will detect the network automatically.')
        }

        // Create a network if we don't have one.
        if (this._json.networks[network_id] == null) {
          this._json.networks[network_id] = {
            events: {},
            links: {}
          }
        }

        // Finally, set the address.
        this.network.address = val
      }
    },
    transactionHash: {
      get: function () {
        var transactionHash = this.network.transactionHash

        if (transactionHash === null) {
          throw new Error('Could not find transaction hash for ' + this.contractName)
        }

        return transactionHash
      },
      set: function (val) {
        this.network.transactionHash = val
      }
    },
    links: function () {
      if (!this.network_id) {
        throw new Error(this.contractName + ' has no network id set, cannot lookup artifact data. Either set the network manually using ' + this.contractName + '.setNetwork(), run ' + this.contractName + '.detectNetwork(), or use new(), at() or deployed() as a thenable which will detect the network automatically.')
      }

      if (this._json.networks[this.network_id] == null) {
        return {}
      }

      return this.network.links || {}
    },
    events: function () {
      return []
    },
    binary: function () {
      return Utils.linkBytecode(this.bytecode, this.links)
    },
    deployedBinary: function () {
      return Utils.linkBytecode(this.deployedBytecode, this.links)
    },
    // deprecated; use bytecode
    unlinked_binary: {
      get: function () {
        return this.bytecode
      },
      set: function (val) {
        this.bytecode = val
      }
    },
    // alias for unlinked_binary; unlinked_binary will eventually be deprecated
    bytecode: {
      get: function () {
        return this._json.bytecode
      },
      set: function (val) {
        this._json.bytecode = val
      }
    },
    deployedBytecode: {
      get: function () {
        var code = this._json.deployedBytecode

        if (code.indexOf('0x') != 0) {
          code = '0x' + code
        }

        return code
      },
      set: function (val) {
        var code = val

        if (val.indexOf('0x') != 0) {
          code = '0x' + code
        }

        this._json.deployedBytecode = code
      }
    },
    sourceMap: {
      get: function () {
        return this._json.sourceMap
      },
      set: function (val) {
        this._json.sourceMap = val
      }
    },
    deployedSourceMap: {
      get: function () {
        return this._json.deployedSourceMap
      },
      set: function (val) {
        this._json.deployedSourceMap = val
      }
    },
    source: {
      get: function () {
        return this._json.source
      },
      set: function (val) {
        this._json.source = val
      }
    },
    sourcePath: {
      get: function () {
        return this._json.sourcePath
      },
      set: function (val) {
        this._json.sourcePath = val
      }
    },
    legacyAST: {
      get: function () {
        return this._json.legacyAST
      },
      set: function (val) {
        this._json.legacyAST = val
      }
    },
    ast: {
      get: function () {
        return this._json.ast
      },
      set: function (val) {
        this._json.ast = val
      }
    },
    compiler: {
      get: function () {
        return this._json.compiler
      },
      set: function (val) {
        this._json.compiler = val
      }
    },
    // Deprecated
    schema_version: function () {
      return this.schemaVersion
    },
    schemaVersion: function () {
      return this._json.schemaVersion
    },
    // deprecated
    updated_at: function () {
      return this.updatedAt
    },
    updatedAt: function () {
      try {
        return this.network.updatedAt || this._json.updatedAt
      } catch (e) {
        return this._json.updatedAt
      }
    }
  }

  Utils.bootstrap(Contract)

  module.exports = Contract

  return Contract
})(module || {})
