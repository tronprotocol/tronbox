const migrate = require('./migrate');

const command = {
  command: 'deploy',
  describe: 'Alias for migrate',
  builder: yargs => {
    migrate.builder(yargs, 'deploy');
  },
  run: migrate.run
};

module.exports = command;
