const axios = require('axios');
const { TronWeb } = require('../TronWrap');
const wrapper = require('./wrapper');

module.exports = {
  wrap: function (provider, options) {
    return wrapper.wrap(provider, options);
  },

  create: function (options) {
    let provider;
    const fullHost = options.fullHost || options.fullNode;

    if (options.provider && typeof options.provider === 'function') {
      provider = options.provider();
    } else if (options.provider) {
      provider = options.provider;
    } else {
      const HttpProvider = TronWeb.providers.HttpProvider;

      HttpProvider.prototype.send = async function (payload) {
        const { data } = await axios.post(`${fullHost}/jsonrpc`, payload);
        return data;
      };

      HttpProvider.prototype.sendAsync = function (payload, callback) {
        return axios
          .post(`${fullHost}/jsonrpc`, payload)
          .then(({ data }) => {
            callback(null, data);
          })
          .catch(error => {
            callback(error);
          });
      };

      provider = new HttpProvider(fullHost);
    }
    return this.wrap(provider, options);
  },

  test_connection: function (provider, callback) {
    callback(null, true);
  }
};
