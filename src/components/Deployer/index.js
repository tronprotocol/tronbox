const expect = require('@truffle/expect')
const DeferredChain = require('./src/deferredchain')
const deploy = require('./src/actions/deploy')
const deployMany = require('./src/actions/deploymany')
const link = require('./src/actions/link')
const create = require('./src/actions/new')
const {dlog} = require('../TronWrap')

function Deployer(options) {
  const self = this
  options = options || {}

  expect.options(options, [
    'provider',
    'network',
    'network_id'
  ])

  this.chain = new DeferredChain()
  this.logger = options.logger || {
    log: function () {
    }
  }
  this.known_contracts = {};
  (options.contracts || []).forEach(function (contract) {
    self.known_contracts[contract.contract_name] = contract
  })
  this.network = options.network
  this.network_id = options.network_id
  this.provider = options.provider
  this.basePath = options.basePath || process.cwd()
  this.options = options
}

// Note: In all code below we overwrite this.chain every time .then() is used
// in order to ensure proper error processing.

Deployer.prototype.start = function () {
  return this.chain.start()
}

Deployer.prototype.link = function (library, destinations) {
  return this.queueOrExec(link(library, destinations, this))
}

Deployer.prototype.deploy = function () {
  const args = Array.prototype.slice.call(arguments)
  const contract = args.shift()

  if (Array.isArray(contract)) {
    dlog('Deploy many')
    return this.queueOrExec(deployMany(contract, this))
  } else {
    dlog('Deploy one')
    return this.queueOrExec(deploy(contract, args, this))
  }
}

Deployer.prototype.new = function () {
  const args = Array.prototype.slice.call(arguments)
  const contract = args.shift()

  return this.queueOrExec(create(contract, args, this))
}

Deployer.prototype.exec = function () {
  throw new Error('deployer.exec() has been deprecated; please seen the tronbox-require package for integration.')
}

Deployer.prototype.then = function (fn) {
  const self = this

  return this.queueOrExec(function () {
    self.logger.log('Running step...')
    return fn(this)
  })
}

Deployer.prototype.queueOrExec = function (fn) {

  if (this.chain.started) {
    return new Promise(function (accept) {
      accept()
    }).then(fn)
  } else {
    return this.chain.then(fn)
  }
}

module.exports = Deployer
