const path = require('path');
const pkg = require('../pkg');
const describe = 'Run JavaScript contract tests';

const command = {
  command: 'test',
  describe,
  builder: yargs => {
    yargs
      .usage(
        `TronBox v${pkg.version}\n\n${describe}\n
Usage: $0 test [<files...>] [--file <file>]
                    [--network <network>] [--compile-all] [--evm]`
      )
      .version(false)
      .options({
        file: {
          describe: 'Run a single JavaScript test file',
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
    const Config = require('../../components/Config');
    const Artifactor = require('../../components/Artifactor');
    const Test = require('../test');
    const fs = require('fs-extra');
    const Environment = require('../environment');
    const TronWrap = require('../../components/TronWrap');

    const { logErrorAndExit } = TronWrap;

    const config = Config.detect(options);

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
      Array.prototype.push.apply(files, options._.map(String));
    }

    function getFiles(callback) {
      if (files.length !== 0) {
        const workingDirectoryPath = path.resolve(config.working_directory);
        for (const file of files) {
          const resolvedPath = path.resolve(process.cwd(), file);
          const relative = path.relative(workingDirectoryPath, resolvedPath);
          if (relative.startsWith('..') || path.isAbsolute(relative)) {
            return callback(new Error(`${file} is outside the project directory.`));
          }
          if (!file.match(config.test_file_extension_regexp)) {
            return callback(
              new Error(`${file} is not a JavaScript test file. tronbox runs tests written in JavaScript.`)
            );
          }
          if (!fs.existsSync(resolvedPath)) {
            return callback(new Error(`${file} does not exist.`));
          }
        }
        return callback(null, files);
      }

      dir.files(config.test_directory, callback);
    }

    getFiles(function (err, files) {
      if (err) return done(err);

      files = files.filter(function (file) {
        return file.match(config.test_file_extension_regexp) != null;
      });

      if (!config.networks[config.network]) {
        return done(new Error('No development or test environment is configured in your project configuration.'));
      }

      Environment.detect(config, function (err) {
        if (err) return done(err);

        let tmpDir;
        try {
          tmpDir = fs.mkdtempSync(path.join(OS.tmpdir(), 'tronbox-test-'));
        } catch (e) {
          return done(e);
        }

        function cleanup(...args) {
          try {
            fs.removeSync(tmpDir);
          } catch (e) {}
          done(...args);
        }

        function run() {
          config.logger.log("Using network '" + config.network + "'." + OS.EOL);

          // Set a new artifactor; don't rely on the one created by Environments.
          // TODO: Make the test artifactor configurable.
          config.artifactor = new Artifactor(tmpDir);

          Test.run(
            config.with({
              test_files: files,
              contracts_build_directory: tmpDir,
              _allowExternalContractsBuildDirectory: true
            }),
            cleanup
          );
        }

        // Copy all the built files over to a temporary directory, because we
        // don't want to save any tests artifacts. Only do this if the build directory
        // exists.
        fs.stat(config.contracts_build_directory, function (err) {
          if (err) return run();

          fs.copy(config.contracts_build_directory, tmpDir, function (err) {
            if (err) return cleanup(err);

            run();
          });
        });
      });
    });
  }
};

module.exports = command;
