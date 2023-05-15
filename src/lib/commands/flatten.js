const command = {
  command: 'flatten',
  description: 'Flattens and prints contracts and their dependencies',
  builder: {},
  run: function (options, done) {
    process.env.CURRENT = 'flatten';
    const Flatten = require('../../components/Flatten');

    const filePaths = options._;

    if (!filePaths.length) {
      console.error('Usage: tronbox flatten <files>\n');
      done();
      return;
    }

    Flatten.run(filePaths, done);
  }
};

module.exports = command;
