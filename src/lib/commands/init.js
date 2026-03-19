const version = require('../version');
const describe = 'Initialize new TronBox project';

const command = {
  command: 'init',
  describe,
  builder: yargs => {
    yargs
      .usage(
        `TronBox v${version.bundle}\n\n${describe}\n
Usage: $0 init`
      )
      .version(false)
      .group(['help'], 'Options:');
  },
  run: function (options, done) {
    process.env.CURRENT = 'init';
    const Config = require('../../components/Config');
    const OS = require('os');
    const InitCommand = require('../../components/Init');

    const config = Config.default().with({
      logger: console
    });

    if (options._ && options._.length > 0) {
      config.logger.log('ERROR: `tronbox init` no longer accepts a project template name as an argument.');
      config.logger.log();
      config.logger.log(
        ' - For an empty project, use `tronbox init` with no arguments' +
          OS.EOL +
          ' - Or, browse the TronBox Boxes at <https://github.com/tronsuper>!'
      );
      process.exit(1);
    }

    InitCommand.run(options, done);
  }
};

module.exports = command;
