const migrate = require('./migrate');

const command = {
  command: 'deploy',
  description: '(alias for migrate)',
  builder: migrate.builder,
  run: migrate.run
};

module.exports = command;
