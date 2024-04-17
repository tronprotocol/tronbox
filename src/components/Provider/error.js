const TruffleError = require('@truffle/error');

// HACK: string comparison seems to be only way to identify being unable to
// connect to RPC node.
const NOT_CONNECTED_MESSAGE = 'Invalid JSON RPC response: ""';

class ProviderError extends TruffleError {
  constructor(message) {
    if (message === NOT_CONNECTED_MESSAGE) {
      message =
        'Could not connect to your Ethereum client. ' +
        'Please check that your Ethereum client:\n' +
        '    - is running\n' +
        '    - is accepting RPC connections (i.e., "--rpc" option is used in geth)\n' +
        '    - is accessible over the network\n' +
        '    - is properly configured in your tronbox configuration file (tronbox.js)\n';
    }
    super(message);
    this.message = message;
  }
}

module.exports = ProviderError;
