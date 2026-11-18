const pkg = require('../pkg');
const describe = 'Run migrations to deploy contracts';

const command = {
  command: 'migrate',
  describe,
  builder: (yargs, cmd = 'migrate') => {
    yargs
      .usage(
        `TronBox v${pkg.version}\n\n${describe}\n
Usage: $0 ${cmd} [--network <network>]
               ${' '.repeat(cmd.length)} [--reset] [--from <number>] [--to <number>]
               ${' '.repeat(cmd.length)} [--compile-all] [--evm] [--quiet]`
      )
      .version(false)
      .options({
        network: {
          describe: 'Network name in configuration',
          type: 'string'
        },
        reset: {
          describe: 'Run migrations from the beginning',
          type: 'boolean'
        },
        from: {
          alias: 'f',
          describe: 'Start at this migration number',
          type: 'number'
        },
        to: {
          describe: 'Run through this migration number',
          type: 'number'
        },
        'compile-all': {
          describe: 'Recompile all contracts',
          type: 'boolean'
        },
        evm: {
          describe: 'Use EVM configuration',
          type: 'boolean'
        },
        quiet: {
          describe: 'Suppress all output except errors',
          type: 'boolean'
        }
      })
      .example(`$0 ${cmd}`, 'Run pending migrations on the default network')
      .example(`$0 ${cmd} --network nile`, 'Run pending migrations on the Nile network')
      .example(`$0 ${cmd} --reset`, 'Run migrations from the beginning')
      .group(['network', 'reset', 'from', 'to', 'compile-all', 'evm', 'quiet', 'help'], 'Options:');
  },
  run: function (options, done) {
    process.env.CURRENT = 'migrate';
    const OS = require('os');
    const Config = require('../../components/Config');
    const Contracts = require('../../components/WorkflowCompile');
    const Migrate = require('../../components/Migrate');
    const Environment = require('../environment');
    const TronWrap = require('../../components/TronWrap');

    const { dlog, logErrorAndExit } = TronWrap;

    if (options.quiet || options.silent) {
      options.logger = {
        log: function () {}
      };
    }

    const config = Config.detect(options);

    // init TronWeb
    try {
      TronWrap(config.networks[config.network], {
        evm: options.evm,
        verify: true,
        logger: options.logger
      });
    } catch (err) {
      logErrorAndExit(console, err.message);
    }

    function runMigrations(callback) {
      if (Number.isFinite(options.f)) {
        Migrate.runFrom(Math.max(0, options.f), config, done);
      } else {
        Migrate.needsMigrating(config, function (err, needsMigrating) {
          if (err) return callback(err);

          if (needsMigrating) {
            dlog('Starting migration');
            Migrate.run(config, done);
          } else {
            config.logger.log('Network up to date.');
            callback();
          }
        });
      }
    }

    config.logger.log("Using network '" + config.network + "'." + OS.EOL);

    Contracts.compile(config, function (err) {
      if (err) return done(err);
      Environment.detect(config, function (err) {
        if (err) return done(err);

        config.logger.log();
        runMigrations(done);
      });
    });
  }
};

module.exports = command;
