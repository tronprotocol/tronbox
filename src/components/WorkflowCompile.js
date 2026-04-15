const mkdirp = require('mkdirp');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Config = require('./Config');
const compile = require('./Compile');
const { expect } = require('../lib/utils');
const Resolver = require('./Resolver');
const Artifactor = require('./Artifactor');
const TronWrap = require('./TronWrap');

async function getCompilerVersion(options) {
  const config = Config.detect(options);

  // if "development" exists, default to using that
  if (!config.network && config.networks.development) {
    config.network = 'development';
  }
  let tronWrap;
  try {
    tronWrap = TronWrap(config.networks[config.network], {
      evm: options.evm,
      verify: true,
      logger: options.logger
    });
    const networkInfo = await tronWrap._getNetworkInfo();
    return Promise.resolve(networkInfo || {});
  } catch (err) {
    return Promise.resolve({});
  }
}

const Contracts = {
  // contracts_directory: String. Directory where .sol files can be found.
  // contracts_build_directory: String. Directory where .sol.js files can be found and written to.
  // all: Boolean. Compile all sources found. Defaults to true. If false, will compare sources against built files
  //      in the build directory to see what needs to be compiled.
  // network_id: network id to link saved contract artifacts.
  // quiet: Boolean. Suppress output. Defaults to false.
  // strict: Boolean. Return compiler warnings as errors. Defaults to false.
  compile: function (options, callback) {
    const self = this;

    expect.options(options, ['contracts_build_directory', 'build_info_directory']);

    expect.one(options, ['contracts_directory', 'files']);

    // Use a config object to ensure we get the default sources.
    const config = Config.default().merge(options);

    if (!config.resolver) {
      config.resolver = new Resolver(config);
    }

    if (!config.artifactor) {
      config.artifactor = new Artifactor(config.contracts_build_directory);
    }

    function finished(err, contracts, paths, buildInfo) {
      if (err) return callback(err);

      if (contracts != null && Object.keys(contracts).length > 0) {
        self.write_contracts(contracts, config, buildInfo, async function (err, abstractions) {
          options.logger.log('');
          options.logger.log(`> Compiled successfully using:`);
          const solcVersion = options.networks?.compilers
            ? options.networks?.compilers?.solc?.version
            : options.compilers?.solc?.version;
          options.logger.log(`  - solc${options.evm ? '(EVM)' : ''}: ${solcVersion}`);
          callback(err, abstractions, paths);
        });
      } else {
        options.logger.log('> Everything is up to date, there is nothing to compile.');
        callback(null, [], paths);
      }
    }

    function start() {
      options.logger.log('Compiling your contracts...');
      options.logger.log('===========================');

      if (config.all === true || config.compileAll === true) {
        compile.all(config, finished);
      } else {
        compile.necessary(config, finished);
      }
    }

    getCompilerVersion(options)
      .then(networkInfo => {
        config.networkInfo = networkInfo;
        start();
      })
      .catch(start);
  },

  write_contracts: function (contracts, options, buildInfo, callback) {
    mkdirp(options.contracts_build_directory, function (err) {
      if (err != null) {
        callback(err);
        return;
      }

      if (!options.quietWrite) {
        options.logger.log(
          'Writing artifacts to .' +
            path.sep +
            path.relative(options.working_directory, options.contracts_build_directory)
        );
      }

      options.artifactor
        .saveAll(contracts)
        .then(function () {
          writeBuildInfo(options, buildInfo);
          callback(null, contracts);
        })
        .catch(callback);
    });
  }
};

function writeBuildInfo(options, buildInfo) {
  if (options.quietWrite || !buildInfo) return;

  const buildInfoDir = options.build_info_directory;
  const { input, output } = buildInfo;
  const hash = crypto.createHash('sha256').update(input).digest('hex');

  try {
    fs.mkdirSync(buildInfoDir, { recursive: true });
    fs.writeFileSync(path.join(buildInfoDir, `${hash}.json`), input);
    fs.writeFileSync(path.join(buildInfoDir, `${hash}.output.json`), output);
  } catch (e) {
    options.logger.log(`Warning: failed to write build-info: ${e.message}`);
  }
}

module.exports = Contracts;
