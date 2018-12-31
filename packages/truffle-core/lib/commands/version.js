var command = {
  command: 'version',
  description: 'Show version number and exit',
  builder: {},
  run: function (options, done) {
    process.env.CURRENT = 'version'
    var version = require("../version");

    var bundle_version;

    if (version.bundle) {
      bundle_version = "v" + version.bundle;
    } else {
      bundle_version = "(unbundled)";
    }

    options.logger.log("Tronbox " + bundle_version + " (core: " + version.core + ")");
    options.logger.log("Solidity v" + version.solc + " (tron-solc)");

    done();
  }
}

module.exports = command;
