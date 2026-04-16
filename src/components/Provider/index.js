const axios = require('axios');
const { providers } = require('tronweb');
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
      provider = new providers.HttpProvider(fullHost);

      provider.send = async function (payload) {
        const { data } = await axios.post(`${fullHost}/jsonrpc`, payload);
        return data;
      };

      provider.sendAsync = function (payload, callback) {
        return axios
          .post(`${fullHost}/jsonrpc`, payload)
          .then(({ data }) => {
            callback(null, data);
          })
          .catch(error => {
            callback(error);
          });
      };
    }
    return this.wrap(provider, options);
  }
};
