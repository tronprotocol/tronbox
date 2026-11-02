const Mocha = require('mocha');
const chai = require('chai');
const path = require('path');
const Config = require('../components/Config');
const Contracts = require('../components/WorkflowCompile');
const Resolver = require('../components/Resolver');
const ResolverIntercept = require('../components/Resolver/intercept');
const { expect } = require('./utils');
const Migrate = require('../components/Migrate');
const Profiler = require('../components/Compile/profiler');
const TronWrap = require('../components/TronWrap');
const waitForTransactionReceipt = require('../components/waitForTransactionReceipt');

const Test = {
  run: function (options, callback) {
    const self = this;

    expect.options(options, [
      'contracts_directory',
      'contracts_build_directory',
      'migrations_directory',
      'test_files',
      'network',
      'network_id'
    ]);

    const config = Config.default().merge(options);

    config.test_files = config.test_files.map(function (test_file) {
      return path.resolve(test_file);
    });

    const mocha = this.createMocha(config);

    const js_tests = config.test_files.filter(function (file) {
      return path.extname(file) !== '.sol';
    });

    // Reserved for future `.sol` tests; excluded by `test_file_extension_regexp`.
    const sol_tests = config.test_files.filter(function (file) {
      return path.extname(file) === '.sol';
    });

    // Add JavaScript tests because there's nothing we need to do with them.
    js_tests.forEach(function (file) {
      // There's an idiosyncrasy in Mocha where the same file can't be run twice
      // unless we delete the `require` cache.
      // https://github.com/mochajs/mocha/issues/995
      delete require.cache[file];

      mocha.addFile(file);
    });

    let accounts = [];

    const tronWrap = TronWrap();

    tronWrap
      ._getAccounts()
      .then(accs => {
        accounts = accs;

        if (!config.from) {
          config.from = accounts[0];
        }

        // Always rebuild the resolver: the test command swaps
        // `contracts_build_directory` to a tmp dir after Environment.detect, so any
        // resolver created earlier still points at the stale build dir.
        config.resolver = new Resolver(config);

        return self.compileContractsWithTestFilesIfNeeded(sol_tests, config);
      })
      .then(function () {
        console.info();
        console.info('Deploying contracts to development network...');
        return self.performInitialDeploy(config);
      })
      .then(function () {
        console.info('Preparing JavaScript tests (if any)...');
        return self.setJSTestGlobals(accounts, config.resolver);
      })
      .then(function () {
        mocha.run(function (failures) {
          // Use 0/1 exit codes to avoid truncation and conflicts with shell status codes.
          callback(failures ? 1 : 0);
        });
      })
      .catch(callback);
  },

  createMocha: function (config) {
    // Allow people to specify config.mocha in their config.
    const mochaConfig = config.mocha || {};

    mochaConfig.reporterOptions = {
      maxDiffSize: 0,
      ...mochaConfig.reporterOptions
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

  compileContractsWithTestFilesIfNeeded: function (solidity_test_files, config) {
    return new Promise(function (accept, reject) {
      Profiler.updated(config, function (err, updated) {
        if (err) return reject(err);

        updated = updated || [];

        // Compile project contracts and test contracts
        Contracts.compile(
          config.with({
            all: config.compileAll === true,
            files: updated.concat(solidity_test_files),
            quiet: false,
            quietWrite: true
          }),
          function (err, abstractions, paths) {
            if (err) return reject(err);
            accept(paths);
          }
        );
      });
    });
  },

  performInitialDeploy: function (config) {
    return new Promise(function (accept, reject) {
      Migrate.run(
        config.with({
          reset: true,
          quiet: true,
          logger: {
            log: function () {}
          }
        }),
        function (err) {
          if (err) return reject(err);
          accept();
        }
      );
    });
  },

  setJSTestGlobals: function (accounts, resolver) {
    return new Promise(function (accept) {
      global.assert = chai.assert;
      global.expect = chai.expect;
      global.artifacts = new ResolverIntercept(resolver);

      const template = function (tests) {
        this.timeout(300000);

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
      if (global.tronWrap._ethers) {
        global.ethers = global.tronWrap._ethers;
      }

      accept();
    });
  }
};

module.exports = Test;
