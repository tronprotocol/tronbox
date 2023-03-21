const command = {
  command: 'build',
  description: 'Execute build pipeline (if configuration present)',
  builder: {},
  run: function (options, done) {
    process.env.CURRENT = 'build';
    const Config = require('../../components/Config');
    const Build = require('../build');

    const config = Config.detect(options);
    Build.build(config, done);
  }
};

module.exports = command;
