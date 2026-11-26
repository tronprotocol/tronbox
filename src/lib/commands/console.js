const pkg = require('../pkg');
const describe = 'Open a console with contracts and TronBox commands';

const command = {
  command: 'console',
  describe,
  builder: yargs => {
    yargs
      .usage(
        `TronBox v${pkg.version}\n\n${describe}\n
Usage: $0 console [--network <network>] [--evm]`
      )
      .version(false)
      .options({
        network: {
          describe: 'Network name in configuration',
          type: 'string'
        },
        evm: {
          describe: 'Use EVM configuration',
          type: 'boolean'
        }
      })
      .example('$0 console', 'Open the console on the default network')
      .example('$0 console --network nile', 'Open the console on the Nile network')
      .example('$0 console --evm', 'Open the console using EVM configuration')
      .group(['network', 'evm', 'help'], 'Options:');
  },
  run: function (options, done) {
    process.env.CURRENT = 'console';
    const Config = require('../../components/Config');
    const Console = require('../console');
    const Environment = require('../environment');
    const TronWrap = require('../../components/TronWrap');

    const { logErrorAndExit } = TronWrap;

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

    // This require a smell?
    const commands = require('./index');
    const excluded = ['console', 'init', 'flatten', 'unbox', 'node'];

    const available_commands = Object.keys(commands).filter(function (name) {
      return excluded.indexOf(name) === -1;
    });

    const console_commands = {};
    available_commands.forEach(function (name) {
      console_commands[name] = commands[name];
    });

    Environment.detect(config, function (err) {
      if (err) return done(err);

      const c = new Console(console_commands, config.with({}));
      c.start(done);
    });
  }
};

module.exports = command;
