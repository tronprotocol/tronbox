const TruffleError = require('@truffle/error');
const expect = require('@truffle/expect');
const Resolver = require('../components/Resolver');
const Artifactor = require('../components/Artifactor');
const TronWrap = require('../components/TronWrap');

const Environment = {
  // It's important config is a Config object and not a vanilla object
  detect: function (config, callback) {
    expect.options(config, ['networks']);

    if (!config.resolver) {
      config.resolver = new Resolver(config);
    }

    if (!config.artifactor) {
      config.artifactor = new Artifactor(config.contracts_build_directory);
    }

    if (!config.network && config.networks['development']) {
      config.network = 'development';
    }

    if (!config.network) {
      return callback(new Error('No network specified. Cannot determine current network.'));
    }
    const network_config = config.networks[config.network];

    if (!network_config) {
      return callback(
        new TruffleError(
          'Unknown network "' + config.network + '". See your tronbox configuration file for available networks.'
        )
      );
    }

    let network_id = config.networks[config.network].network_id;

    if (!network_id) {
      return callback(
        new Error(
          "You must specify a network_id in your '" + config.network + "' configuration in order to use this network."
        )
      );
    }

    const tronWrap = TronWrap();

    function detectNetworkId(done) {
      if (network_id !== '*') {
        return done(null, network_id);
      }
      network_id = '*';
      config.networks[config.network].network_id = network_id;
      done(null, network_id);
    }

    function detectFromAddress(done) {
      if (config.from) {
        return done();
      }

      tronWrap._getAccounts(function (err, accounts) {
        if (err) return done(err);
        config.networks[config.network].from = accounts[0];
        config.networks[config.network].privateKey = tronWrap._privateKeyByAccount[accounts[0]];
        done();
      });
    }

    detectNetworkId(function (err) {
      if (err) return callback(err);
      detectFromAddress(callback);
    });
  },

  // Ensure you call Environment.detect() first.
  fork: function (config, callback) {
    expect.options(config, ['from']);

    const forkedNetwork = config.network + '-fork';

    config.networks[forkedNetwork] = {
      network_id: config.network_id,
      provider: undefined,
      //   TestRPC.provider({
      //   fork: config.provider,
      //   unlocked_accounts: [config.networks[config.network].from]
      // }),
      from: config.from
    };
    config.network = forkedNetwork;

    callback();
  },

  develop: function (config, testrpcOptions, callback) {
    expect.options(config, ['networks']);

    const network = config.network || 'develop';

    config.networks[network] = {
      network_id: testrpcOptions.network_id,
      provider: ''
    };

    config.network = network;

    Environment.detect(config, callback);
  }
};

module.exports = Environment;
