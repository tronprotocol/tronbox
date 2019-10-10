// var pkg = require("../../package.json");
// var solcpkg = require("tron-solc/package.json");

var bundle = require("../../package.json");

module.exports = {
  // core: pkg.version,
  bundle: bundle.version,
  // solc: solcpkg.version
};
