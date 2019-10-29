const TruffleError = require('@truffle/error')
const inherits = require('util').inherits

inherits(ConfigurationError, TruffleError)

function ConfigurationError(message) {
  ConfigurationError.super_.call(this, message)
}

module.exports = ConfigurationError
