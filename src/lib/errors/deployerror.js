const colors = require('colors');
const TruffleError = require('@truffle/error');
class DeployError extends TruffleError {
  constructor(message) {
    message = 'Error deploying ' + contract_name + ':\n\n' + message + '\n\n' + colors.red('Deploy failed. See above.');
    super(message);
  }
}

module.exports = DeployError;
