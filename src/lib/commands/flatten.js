const version = require('../version');
const describe = 'Flattens and prints contracts and their dependencies';

const command = {
  command: 'flatten',
  describe,
  builder: yargs => {
    yargs
      .usage(
        `TronBox v${version.bundle}\n\n${describe}\n
Usage: $0 flatten <files...>`
      )
      .version(false)
      .positional('files', {
        describe: 'One or more contract source file paths to flatten',
        type: 'string',
        array: true,
        demandOption: true
      })
      .group(['help'], 'Options:')
      .example('$0 flatten contracts/Foo.sol', '')
      .example('$0 flatten contracts/Foo.sol contracts/Bar.sol', '')
      .example('$0 flatten contracts/Foo.sol > Flattened.sol', '');
  },
  run: function (options, done) {
    process.env.CURRENT = 'flatten';
    const Flatten = require('../../components/Flatten');

    const filePaths = options._.slice();

    if (!filePaths.length) {
      console.error('Usage: tronbox flatten <files...>\n');
      done();
      return;
    }

    Flatten.run(filePaths, done);
  }
};

module.exports = command;
