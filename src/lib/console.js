const ReplManager = require('./repl')
const Command = require('./command')
const provision = require('../components/Provisioner')
const contract = require('../components/Contract')
const TronWrap = require('../components/TronWrap')
const vm = require('vm')
const expect = require('@truffle/expect')
const TruffleError = require('@truffle/error')
const fs = require('fs')
const path = require('path')
const EventEmitter = require('events')
const inherits = require('util').inherits
const logErrorAndExit = require('../components/TronWrap').logErrorAndExit

inherits(Console, EventEmitter)

function Console(tasks, options) {
  EventEmitter.call(this)

  const self = this

  expect.options(options, [
    'working_directory',
    'contracts_directory',
    'contracts_build_directory',
    'migrations_directory',
    'network',
    'network_id',
    'provider',
    'resolver',
    'build_directory'
  ])

  this.options = options

  this.repl = options.repl || new ReplManager(options)
  this.command = new Command(tasks)

  // if "development" exists, default to using that
  if (!options.network && options.networks.development) {
    options.network = 'development'
  }

  try {
    this.tronWrap = TronWrap(options.networks[options.network], {
      verify: true,
      log: options.log
    })
  } catch (err) {
    logErrorAndExit(console, err.message)
  }

  // this.tronWrap.setHttpProvider(options.provider);

  // Bubble the ReplManager's exit event
  this.repl.on('exit', function () {
    self.emit('exit')
  })
}

Console.prototype.start = function (callback) {
  const self = this

  if (!this.repl) {
    this.repl = new ReplManager(this.options)
  }

  // TODO: This should probalby be elsewhere.
  // It's here to ensure the repl manager instance gets
  // passed down to commands.
  this.options.repl = this.repl

  this.provision(function (err, abstractions) {
    if (err) {
      self.options.logger.log('Unexpected error: Cannot provision contracts while instantiating the console.')
      self.options.logger.log(err.stack || err.message || err)
    }

    self.repl.start({
      prompt: 'tronbox(' + self.options.network + ')> ',
      context: {
        tronWrap: self.tronWrap,
      },
      interpreter: self.interpret.bind(self),
      done: callback
    })

    self.resetContractsInConsoleContext(abstractions)
  })
}

Console.prototype.provision = function (callback) {
  const self = this

  fs.readdir(this.options.contracts_build_directory, function (err, files) {
    if (err) {
      // Error reading the build directory? Must mean it doesn't exist or we don't have access to it.
      // Couldn't provision the contracts if we wanted. It's possible we're hiding very rare FS
      // errors, but that's better than showing the user error messages that will be "build folder
      // doesn't exist" 99.9% of the time.
    }

    const promises = []
    files = files || []

    files.forEach(function (file) {
      promises.push(new Promise(function (accept, reject) {
        fs.readFile(path.join(self.options.contracts_build_directory, file), 'utf8', function (err, body) {
          if (err) return reject(err)
          try {
            body = JSON.parse(body)
          } catch (e) {
            return reject(new Error('Cannot parse ' + file + ': ' + e.message))
          }

          accept(body)
        })
      }))
    })

    Promise.all(promises).then(function (json_blobs) {
      const abstractions = json_blobs.map(function (json) {
        const abstraction = contract(json)
        provision(abstraction, self.options)
        return abstraction
      })

      self.resetContractsInConsoleContext(abstractions)

      callback(null, abstractions)
    }).catch(callback)
  })
}

Console.prototype.resetContractsInConsoleContext = function (abstractions) {
  const self = this

  abstractions = abstractions || []

  const contextVars = {}

  abstractions.forEach(function (abstraction) {
    contextVars[abstraction.contract_name] = abstraction
  })

  self.repl.setContextVars(contextVars)
}

Console.prototype.interpret = function (cmd, context, filename, callback) {
  const self = this

  if (this.command.getCommand(cmd.trim(), this.options.noAliases) != null) {
    return self.command.run(cmd.trim(), this.options, function (err) {
      if (err) {
        // Perform error handling ourselves.
        if (err instanceof TruffleError) {
          console.error(err.message)
        } else {
          // Bubble up all other unexpected errors.
          console.error(err.stack || err.toString())
        }
        return callback()
      }

      // Reprovision after each command as it may change contracts.
      self.provision(function (err) {
        // Don't pass abstractions to the callback if they're there or else
        // they'll get printed in the repl.
        callback(err)
      })
    })
  }

  let result
  try {
    result = vm.runInContext(cmd, context, {
      displayErrors: false
    })
  } catch (e) {
    return callback(e)
  }

  // Resolve all promises. This will leave non-promises alone.
  Promise.resolve(result).then(function (res) {
    callback(null, res)
  }).catch(callback)
}

module.exports = Console
