const mkdirp = require('mkdirp');
const path = require('path');
const Config = require('./Config');
const compile = require('./Compile');
const { expect } = require('../lib/utils');
const Resolver = require('./Resolver');
const Artifactor = require('./Artifactor');
const TronWrap = require('./TronWrap');
const fs = require("fs");
const md5 = require('md5');

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

    expect.options(options, ['contracts_build_directory']);
    expect.options(options, ['build_info_directory']);
    expect.one(options, ['contracts_directory', 'files']);

    // Use a config object to ensure we get the default sources.
    const config = Config.default().merge(options);

    if (!config.resolver) {
      config.resolver = new Resolver(config);
    }

    if (!config.artifactor) {
      config.artifactor = new Artifactor(config.contracts_build_directory);
    }

    //  Normalize compile targets
    if (Array.isArray(config.compileTargets) && config.compileTargets.length > 0) {
      config.compileTargets = config.compileTargets.map(p =>
        path.resolve(config.working_directory, p)
      );
    }

    function finished(err, contracts, paths, solcStandardInput) {
      if (err) return callback(err);

      if (contracts != null && Object.keys(contracts).length > 0) {
        // Create a hash of the standard JSON input to use as a unique identifier for this compilation. 
        const inputFileName = md5(JSON.stringify(solcStandardInput));
        // Write contract artifacts
        self.write_contracts(contracts, config, async function (err, abstractions) {
          options.logger.log('');
          options.logger.log(`> Compiled successfully using:`);
          const solcVersion = options.networks?.compilers
            ? options.networks?.compilers?.solc?.version
            : options.compilers?.solc?.version;
          options.logger.log(`  - solc${options.evm ? '(EVM)' : ''}: ${solcVersion}`);
          callback(err, abstractions, paths, solcStandardInput);
        });
        self.write_buildInfo(solcStandardInput, config, inputFileName)
      } else {
        options.logger.log('> Everything is up to date, there is nothing to compile.');
        callback(null, [], paths, solcStandardInput);
      }
    }

    function start() {
      options.logger.log('Compiling your contracts...');
      options.logger.log('===========================');

      // Compile specific contracts
      if (config.compileTargets && config.compileTargets.length > 0) {
        return compile.specific(config, finished);
      }

      //If ALL option is selected compile all contracts
      if (config.all === true || config.compileAll === true) {
        return compile.all(config, finished);
      }
      //Compile modified contracts if none of the above is true
      return compile.necessary(config, finished);
    }

    getCompilerVersion(options)
      .then(networkInfo => {
        config.networkInfo = networkInfo;
        start();
      })
      .catch(start);
  },

  write_contracts: function (contracts, options, callback) {
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

      const extra_opts = {
        network_id: options.network_id
      };

      options.artifactor
        .saveAll(contracts, extra_opts)
        .then(function () {
          callback(null, contracts);
        })
        .catch(callback);
    });
  },
  //Write the standard JSON input to a file in the build info directory. This can be used for verification or debugging purposes.
  write_buildInfo: function (solcStandardInput, options, inputFileName) {

    mkdirp(options.build_info_directory, function (err) {
      if (err != null) {
        callback(err);
        return;
      }

      if (!options.quietWrite) {
        options.logger.log(
          'Writing jsnoninput file to .' +
          path.sep +
          path.relative(options.working_directory, options.build_info_directory)
        );
      }
      fs.writeFileSync(path.relative(options.working_directory, options.build_info_directory) + path.sep + `${inputFileName}.json`, JSON.stringify(solcStandardInput));

    })
  }

};

module.exports = Contracts;
