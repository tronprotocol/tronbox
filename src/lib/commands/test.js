const version = require('../version');
const path = require('path');
const chalk = require('chalk');
const describe = 'Run contract tests written in JavaScript';

const command = {
  command: 'test',
  describe,
  builder: yargs => {
    yargs
      .usage(
        `TronBox v${version.bundle}\n\n${describe}\n
Usage: $0 test [<files...>] [--file <file>]
                    [--network <network>] [--compile-all] [--evm]`
      )
      .version(false)
      .options({
        file: {
          describe: 'Specify a single test file path to run',
          type: 'string'
        },
        network: {
          describe: 'Network name in configuration',
          type: 'string'
        },
        'compile-all': {
          describe: 'Recompile all contracts',
          type: 'boolean'
        },
        evm: {
          describe: 'Use EVM configuration',
          type: 'boolean'
        }
      })
      .positional('files', {
        describe: 'One or more test file paths to run',
        type: 'string',
        array: true
      })
      .group(['file', 'network', 'compile-all', 'evm', 'help'], 'Options:')
      .example('$0 test', 'Run all tests')
      .example('$0 test test/t1.js', 'Run a single test file')
      .example('$0 test test/t1.js test/t2.js', 'Run multiple test files')
      .example('$0 test --file test/t1.js', 'Run a single test file');
  },
  run: function (options, done) {
    const OS = require('os');
    const dir = require('node-dir');
    const tmp = require('tmp');
    const Config = require('../../components/Config');
    const Artifactor = require('../../components/Artifactor');
    const Test = require('../test');
    const fs = require('fs');
    const fsExtra = require('fs-extra');
    const Environment = require('../environment');
    const TronWrap = require('../../components/TronWrap');
    const logErrorAndExit = require('../../components/TronWrap').logErrorAndExit;

    const config = Config.detect(options);

    // if "development" exists, default to using that for testing
    if (!config.network) {
      if (config.networks.development) config.network = 'development';
      else if (config.networks.test) config.network = 'test';
    }

    if (!config.network) {
      console.error(
        '\nERROR: Neither development nor test network has been set. Please configure a network in your project configuration.\n'
      );
      return;
    }

    try {
      TronWrap(config.networks[config.network], {
        evm: options.evm,
        verify: true,
        tre: true,
        logger: options.logger
      });
    } catch (err) {
      logErrorAndExit(console, err.message);
    }
    process.env.CURRENT = 'test';

    let files = [];

    if (options.file) {
      files = [options.file];
    } else if (options._.length > 0) {
      Array.prototype.push.apply(files, options._);
    }

    function getFiles(callback) {
      if (files.length !== 0) {
        const workingDirectoryPath = path.resolve(config.working_directory);
        files.forEach(file => {
          const resolvedPath = path.resolve(process.cwd(), file);
          const relative = path.relative(workingDirectoryPath, resolvedPath);
          if (relative.startsWith('..') || path.isAbsolute(relative)) {
            throw new Error(chalk.red(chalk.bold('ERROR:') + ` ${file} is outside the project directory.`));
          }
        });
        return callback(null, files);
      }

      dir.files(config.test_directory, callback);
    }

    getFiles(function (err, files) {
      if (err) return done(err);

      files = files.filter(function (file) {
        return file.match(config.test_file_extension_regexp) != null;
      });

      tmp.dir({ unsafeCleanup: true, prefix: 'test-' }, function (err, temporaryDirectory, removeCallback) {
        if (err) return done(err);

        function cleanup(...args) {
          removeCallback();
          done(...args);
        }

        function run() {
          config.logger.log("Using network '" + config.network + "'." + OS.EOL);

          // Set a new artifactor; don't rely on the one created by Environments.
          // TODO: Make the test artifactor configurable.
          config.artifactor = new Artifactor(temporaryDirectory);

          Test.run(
            config.with({
              test_files: files,
              contracts_build_directory: temporaryDirectory,
              _allowExternalContractsBuildDirectory: true
            }),
            cleanup
          );
        }

        const environmentCallback = function (err) {
          if (err) return done(err);
          // Copy all the built files over to a temporary directory, because we
          // don't want to save any tests artifacts. Only do this if the build directory
          // exists.
          fs.stat(config.contracts_build_directory, function (err) {
            if (err) return run();

            fsExtra.copy(config.contracts_build_directory, temporaryDirectory, function (err) {
              if (err) return done(err);

              run();
            });
          });
        };

        if (config.networks[config.network]) {
          Environment.detect(config, environmentCallback);
        } else {
          throw new Error('No development or test environment is configured in your project configuration.');
        }
      });
    });
  }
};

module.exports = command;
