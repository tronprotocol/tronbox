require('source-map-support/register');

const Command = require('./lib/command');
const TaskError = require('./lib/errors/taskerror');
const TruffleError = require('@truffle/error');
const version = require('./lib/version');
const OS = require('os');
const downloader = require('./downloader');

const command = new Command(require('./lib/commands'));

const options = {
  logger: console
};

const commands = process.argv.slice(2);

if (commands[0] === '--download-compiler' && commands[1]) {
  downloader(commands[1]);
} else {
  command.run(process.argv.slice(2), options, function (err) {
    if (err) {
      if (err instanceof TaskError) {
        command.args
          .usage(
            'Tronbox v' +
              (version.bundle || version.core) +
              ' - a development framework for tronweb' +
              OS.EOL +
              OS.EOL +
              'Usage: tronbox <command> [options]'
          )
          .epilog('See more at https://developers.tron.network/docs/tronbox')
          .showHelp();
      } else {
        if (err instanceof TruffleError) {
          console.error(err.message);
        } else if (typeof err === 'number') {
          // If a number is returned, exit with that number.
          // eslint-disable-next-line no-process-exit
          process.exit(err);
        } else {
          // Bubble up all other unexpected errors.
          console.error(err.stack || err.toString());
        }
      }
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    }

    // Don't exit if no error; if something is keeping the process open,
    // like `truffle console`, then let it.

    // Clear any polling or open sockets - `provider-engine` in HDWallet
    // and `web3 1.0 confirmations` both leave interval timers etc wide open.
    const handles = process._getActiveHandles();
    handles.forEach(handle => {
      if (typeof handle.close === 'function') {
        handle.close();
      }
    });
  });
}
