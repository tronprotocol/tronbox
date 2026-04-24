const colors = require('colors');
const TronBoxError = require('../../lib/errors/tronboxerror');

class CompileError extends TronBoxError {
  constructor(message) {
    // Note we trim() because solc likes to add extra whitespace.
    super(message.trim() + '\n\n' + colors.red('Compilation failed. See above.'));
  }
}

module.exports = CompileError;
