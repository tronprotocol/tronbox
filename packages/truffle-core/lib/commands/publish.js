var command = {
  command: 'publish',
  description: 'Publish a package to the tronBox Package Registry',
  builder: {},
  run: function (options, done) {
    process.env.CURRENT = 'publish'
    var Config = require("../../components/Config");
    var Package = require("../package");

    var config = Config.detect(options);
    Package.publish(config, done);
  }
}

module.exports = command;
