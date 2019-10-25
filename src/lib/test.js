var Mocha = require('mocha')
var chai = require('chai')
var path = require('path')
var Config = require('../components/Config')
var Contracts = require('../components/WorkflowCompile')
var Resolver = require('../components/Resolver')
var TestRunner = require('./testing/testrunner')
var TestResolver = require('./testing/testresolver')
var TestSource = require('./testing/testsource')
var expect = require('@truffle/expect')
var Migrate = require('../components/Migrate')
var Profiler = require('../components/Compile/profiler')
var originalrequire = require('original-require')
var TronWrap = require('../components/TronWrap')

chai.use(require('./assertions'))

var Test = {
  run: function (options, callback) {
    var self = this

    expect.options(options, [
      'contracts_directory',
      'contracts_build_directory',
      'migrations_directory',
      'test_files',
      'network',
      'network_id',
      'provider',
    ])

    var config = Config.default().merge(options)

    config.test_files = config.test_files.map(function (test_file) {
      return path.resolve(test_file)
    })

    // Output looks like this during tests: https://gist.github.com/tcoulter/1988349d1ec65ce6b958
    var warn = config.logger.warn
    config.logger.warn = function (message) {
      if (message !== 'cannot find event for log' && warn) {
        warn.apply(console, arguments)
      }
    }

    var mocha = this.createMocha(config)

    var js_tests = config.test_files.filter(function (file) {
      return path.extname(file) !== '.sol'
    })

    var sol_tests = config.test_files.filter(function (file) {
      return path.extname(file) === '.sol'
    })

    // Add Javascript tests because there's nothing we need to do with them.
    // Solidity tests will be handled later.
    js_tests.forEach(function (file) {
      // There's an idiosyncracy in Mocha where the same file can't be run twice
      // unless we delete the `require` cache.
      // https://github.com/mochajs/mocha/issues/995
      delete originalrequire.cache[file]

      mocha.addFile(file)
    })

    var accounts = []
    var runner
    var test_resolver

    var tronWrap = TronWrap()

    tronWrap._getAccounts().then(accs => {
      accounts = accs

      if (!config.from) {
        config.from = accounts[0]
      }

      if (!config.resolver) {
        config.resolver = new Resolver(config)
      }

      var test_source = new TestSource(config)
      test_resolver = new TestResolver(config.resolver, test_source, config.contracts_build_directory)
      test_resolver.cache_on = false

      return self.compileContractsWithTestFilesIfNeeded(sol_tests, config, test_resolver)
    }).then(function () {

      runner = new TestRunner(config)

      console.info('Deploying contracts to development network...')
      return self.performInitialDeploy(config, test_resolver)
    }).then(function () {
      console.info('Preparing Javascript tests (if any)...')
      return self.setJSTestGlobals(accounts, test_resolver, runner)
    }).then(function () {
      // Finally, run mocha.
      process.on('unhandledRejection', function (reason) {
        throw reason
      })

      mocha.run(function (failures) {
        config.logger.warn = warn
        callback(failures)
      })
    }).catch(callback)
  },

  createMocha: function (config) {
    // Allow people to specify config.mocha in their config.
    var mochaConfig = config.mocha || {}

    // If the command line overrides color usage, use that.
    if (config.colors != null) {
      mochaConfig.useColors = config.colors
    }

    // Default to true if configuration isn't set anywhere.
    if (mochaConfig.useColors == null) {
      mochaConfig.useColors = true
    }

    var mocha = new Mocha(mochaConfig)

    return mocha
  },
  compileContractsWithTestFilesIfNeeded: function (solidity_test_files, config, test_resolver) {
    return new Promise(function (accept, reject) {
      Profiler.updated(config.with({
        resolver: test_resolver
      }), function (err, updated) {
        if (err) return reject(err)

        updated = updated || []

        // Compile project contracts and test contracts
        Contracts.compile(config.with({
          all: config.compileAll === true,
          files: updated.concat(solidity_test_files),
          resolver: test_resolver,
          quiet: false,
          quietWrite: true
        }), function (err, abstractions, paths) {
          if (err) return reject(err)
          accept(paths)
        })
      })
    })
  },

  performInitialDeploy: function (config, resolver) {
    return new Promise(function (accept, reject) {

      Migrate.run(config.with({
        reset: true,
        resolver: resolver,
        quiet: true
      }), function (err) {
        if (err) return reject(err)
        accept()
      })
    })
  },

  setJSTestGlobals: function (accounts, test_resolver, runner) {
    return new Promise(function (accept) {
      global.assert = chai.assert
      global.expect = chai.expect
      global.artifacts = {
        require: function (import_path) {
          return test_resolver.require(import_path)
        }
      }

      var template = function (tests) {
        this.timeout(runner.TEST_TIMEOUT)

        before('prepare suite', function (done) {
          this.timeout(runner.BEFORE_TIMEOUT)
          runner.initialize(done)
        })

        beforeEach('before test', function (done) {
          runner.startTest(this, done)
        })

        afterEach('after test', function (done) {
          runner.endTest(this, done)
        })

        tests(accounts)
      }

      global.contract = function (name, tests) {
        Mocha.describe('Contract: ' + name, function () {
          template.bind(this, tests)()
        })
      }

      global.contract.only = function (name, tests) {
        Mocha.describe.only('Contract: ' + name, function () {
          template.bind(this, tests)()
        })
      }

      global.contract.skip = function (name, tests) {
        Mocha.describe.skip('Contract: ' + name, function () {
          template.bind(this, tests)()
        })
      }

      accept()
    })
  }
}

module.exports = Test
