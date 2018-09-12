var Web3 = require("web3");
var TronWrap = require("tronwrap");

var wrapper = require('./wrapper');

module.exports = {
  wrap: function(provider, options) {
    return wrapper.wrap(provider, options);
  },

  create: function(options) {
    var provider;

    if (options.provider && typeof options.provider == "function") {
      provider = options.provider();
    } else if (options.provider) {
      provider = options.provider;
    } else {
      TronWrap.setHttpProvider(options);
      provider = new Web3.providers.HttpProvider("http://" + options.host + ":" + options.port);
    }
    return this.wrap(provider, options);
  },

  test_connection: function(provider, callback) {
    var web3 = new Web3();
    web3.setProvider(provider);
    web3.eth.getCoinbase(function(error, coinbase) {
      if (error != null) {
        error = new Error("Could not connect to your tronbox client. Please check your tronbox configuration.");
      }

      callback(error, coinbase)
    });
  }
};
