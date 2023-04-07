const { maxVersion } = require('../../components/TronSolc');

const command = {
  command: 'version',
  description: 'Show version number and exit',
  builder: {},
  run: function (options, done) {
    process.env.CURRENT = 'version';
    const version = require('../version');

    let bundle_version;

    if (version.bundle) {
      bundle_version = 'v' + version.bundle;
    } else {
      bundle_version = '(unbundled)';
    }

    options.logger.log('Tronbox ' + bundle_version);
    options.logger.log('Solidity v' + maxVersion + ' (tron-solc)');

    done();
  }
};

module.exports = command;
