var wrapper = require('solc/wrapper');

function getWrapper(options = {}) {

  let compilerVersion = options.compilerVersion || 3
  if (options.useZeroFourCompiler) {
    compilerVersion = '3'
  }
  let soljson = require(`./compiler-versions/soljson_v${compilerVersion}.js`)
  return wrapper(soljson)
}

module.exports.getWrapper = getWrapper;
