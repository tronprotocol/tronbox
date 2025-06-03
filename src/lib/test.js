const Mocha = require('mocha');
const chai = require('chai');
const path = require('path');
const Config = require('../components/Config');
const Contracts = require('../components/WorkflowCompile');
const Resolver = require('../components/Resolver');
const TestRunner = require('./testing/testrunner');
const TestResolver = require('./testing/testresolver');
const TestSource = require('./testing/testsource');
const expect = require('@truffle/expect');
const Migrate = require('../components/Migrate');
const Profiler = require('../components/Compile/profiler');
const originalrequire = require('original-require');
const TronWrap = require('../components/TronWrap');
const waitForTransactionReceipt = require('../components/waitForTransactionReceipt');

chai.use(require('./assertions'));

const Test = {
  run: function (options, callback) {
    const self = this;

    expect.options(options, [
      'contracts_directory',
      'contracts_build_directory',
      'migrations_directory',
      'test_files',
      'network',
      'network_id',
      'provider'
    ]);

    const config = Config.default().merge(options);

    config.test_files = config.test_files.map(function (test_file) {
      return path.resolve(test_file);
    });

    // Output looks like this during tests: https://gist.github.com/tcoulter/1988349d1ec65ce6b958
    const warn = config.logger.warn;
    config.logger.warn = function (message) {
      if (message !== 'cannot find event for log' && warn) {
        warn.apply(console, arguments);
      }
    };

    const mocha = this.createMocha(config);

    const js_tests = config.test_files.filter(function (file) {
      return path.extname(file) !== '.sol';
    });

    const sol_tests = config.test_files.filter(function (file) {
      return path.extname(file) === '.sol';
    });

    // Add JavaScript tests because there's nothing we need to do with them.
    // Solidity tests will be handled later.
    js_tests.forEach(function (file) {
      // There's an idiosyncrasy in Mocha where the same file can't be run twice
      // unless we delete the `require` cache.
      // https://github.com/mochajs/mocha/issues/995
      delete originalrequire.cache[file];

      mocha.addFile(file);
    });

    let accounts = [];
    let runner;
    let test_resolver;

    const tronWrap = TronWrap();

    tronWrap
      ._getAccounts()
      .then(accs => {
        accounts = accs;

        if (!config.from) {
          config.from = accounts[0];
        }

        if (!config.resolver) {
          config.resolver = new Resolver(config);
        }

        const test_source = new TestSource(config);
        test_resolver = new TestResolver(config.resolver, test_source, config.contracts_build_directory);
        test_resolver.cache_on = false;

        return self.compileContractsWithTestFilesIfNeeded(sol_tests, config, test_resolver);
      })
      .then(function () {
        runner = new TestRunner(config);

        console.info('Deploying contracts to development network...');
        return self.performInitialDeploy(config, test_resolver);
      })
      .then(function () {
        console.info('Preparing JavaScript tests (if any)...');
        return self.setJSTestGlobals(accounts, test_resolver, runner, config);
      })
      .then(function () {
        // Finally, run mocha.
        process.on('unhandledRejection', function (reason) {
          throw reason;
        });

        mocha.run(function (failures) {
          config.logger.warn = warn;
          callback(failures);
        });
      })
      .catch(callback);
  },

  createMocha: function (config) {
    // Allow people to specify config.mocha in their config.
    const mochaConfig = config.mocha || {};

    mochaConfig.reporterOptions = {
      maxDiffSize: 0
    };

    // If the command line overrides color usage, use that.
    if (config.colors != null) {
      mochaConfig.useColors = config.colors;
    }

    // Default to true if configuration isn't set anywhere.
    if (!mochaConfig.useColors) {
      mochaConfig.useColors = true;
    }

    const mocha = new Mocha(mochaConfig);

    return mocha;
  },

  compileContractsWithTestFilesIfNeeded: function (solidity_test_files, config, test_resolver) {
    return new Promise(function (accept, reject) {
      Profiler.updated(
        config.with({
          resolver: test_resolver
        }),
        function (err, updated) {
          if (err) return reject(err);

          updated = updated || [];

          // Compile project contracts and test contracts
          Contracts.compile(
            config.with({
              all: config.compileAll === true,
              files: updated.concat(solidity_test_files),
              resolver: test_resolver,
              quiet: false,
              quietWrite: true
            }),
            function (err, abstractions, paths) {
              if (err) return reject(err);
              accept(paths);
            }
          );
        }
      );
    });
  },

  performInitialDeploy: function (config, resolver) {
    return new Promise(function (accept, reject) {
      Migrate.run(
        config.with({
          reset: true,
          resolver: resolver,
          quiet: true
        }),
        function (err) {
          if (err) return reject(err);
          accept();
        }
      );
    });
  },

  setJSTestGlobals: function (accounts, test_resolver, runner, config) {
    return new Promise(function (accept) {
      global.assert = chai.assert;
      global.expect = chai.expect;
      global.artifacts = {
        require: function (import_path) {
          return test_resolver.require(import_path);
        }
      };

      global.config = config;

      const template = function (tests) {
        this.timeout(runner.TEST_TIMEOUT);

        before('prepare suite', function (done) {
          this.timeout(runner.BEFORE_TIMEOUT);
          runner.initialize(done);
        });

        beforeEach('before test', function (done) {
          runner.startTest(this, done);
        });

        afterEach('after test', function (done) {
          runner.endTest(this, done);
        });

        tests(accounts);
      };

      global.contract = function (name, tests) {
        Mocha.describe('Contract: ' + name, function () {
          template.bind(this, tests)();
        });
      };

      global.contract.only = function (name, tests) {
        Mocha.describe.only('Contract: ' + name, function () {
          template.bind(this, tests)();
        });
      };

      global.contract.skip = function (name, tests) {
        Mocha.describe.skip('Contract: ' + name, function () {
          template.bind(this, tests)();
        });
      };

      const tronWrap = TronWrap();
      global.tronWrap = tronWrap;
      global.tronWeb = tronWrap;
      global.waitForTransactionReceipt = waitForTransactionReceipt(tronWrap);
      if (global.tronWrap._web3) {
        global.web3 = global.tronWrap._web3;
      }

      accept();
    });
  }
};

module.exports = Test;
