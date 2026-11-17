const pkg = require('../pkg');
const TronBoxError = require('../errors/tronBoxError');
const notice = [
  'The `unbox` command is no longer supported.',
  'Use `init` to initialize a project from the built-in templates.',
  'To use a remote Box, clone its repository and follow its setup instructions.'
].join('\n');

module.exports = {
  command: 'unbox',
  describe: false,
  builder: yargs => {
    yargs.usage(`TronBox v${pkg.version}\n\n${notice}\n\nUsage: $0 unbox`).version(false).group(['help'], 'Options:');
  },
  run: function (_options, done) {
    done(new TronBoxError(notice));
  }
};
