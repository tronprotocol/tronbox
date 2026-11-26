const yargs = require('yargs/yargs');
const pkg = require('../pkg');

const command = {
  command: 'help',
  describe: 'Show help and available commands',
  builder: {},
  run: function (options, done) {
    const args = yargs().scriptName(pkg.name).detectLocale(false).exitProcess(false).version(false).help(false);

    Object.keys(options.commands).forEach(function (command) {
      args.command(options.commands[command]);
    });

    args
      .usage(
        `TronBox v${pkg.version} - a development framework for Tron

Usage: tronbox <command> [options]`
      )
      .epilog('See more at https://tronbox.io/docs/')
      .showHelp();

    done();
  }
};

module.exports = command;
