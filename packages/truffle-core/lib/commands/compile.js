var command = {
  command: 'compile',
  description: 'Compile contract source files',
  builder: {
    all: {
      type: "boolean",
      default: false
    }
  },
  run: function (options, done) {
    process.env.CURRENT = 'compile'
    var Config = require("truffle-config");
    var Contracts = require("truffle-workflow-compile");

    var config = Config.detect(options);
    Contracts.compile(config, done);
  }
}

module.exports = command;
