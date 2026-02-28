require('source-map-support/register');

const Command = require('./lib/command');
const downloader = require('./downloader');

const command = new Command(require('./lib/commands'));

const options = {
  logger: console
};

const commands = process.argv.slice(2);

if (commands[0] === '--download-compiler' && commands[1]) {
  downloader(commands[1], commands[2]);
} else {
  command.run(commands, options, function (err) {
    if (err) {
      if (typeof err === 'number') {
        // If a number is returned, exit with that number.
        process.exit(err);
      } else if (err instanceof Error) {
        console.error(err.message);
      } else {
        // Handle other types (string, object, etc.)
        console.error(typeof err === 'string' ? err : String(err));
      }
      process.exit(1);
    }

    // Don't exit if no error; if something is keeping the process open,
    // like `tronbox console`, then let it.

    // Clear any polling or open sockets - legacy provider engines and
    // confirmation trackers often leave interval timers wide open.
    const handles = process._getActiveHandles();
    handles.forEach(handle => {
      if (typeof handle.close === 'function') {
        handle.close();
      }
    });
  });
}
