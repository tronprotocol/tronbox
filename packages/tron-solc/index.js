var wrapper = require('solc/wrapper');

function getWrapper(options = {}) {

  let compilerVersion = options.compilerVersion || 3
  if (options.compilers && options.compilers.solc && options.compilers.solc.version) {
    if (/0\.4/.test(options.compilers.solc.version)) {
      compilerVersion = '3'
    }
  }
  let soljson = require(`./compiler-versions/soljson_v${compilerVersion}.js`)
  return wrapper(soljson)
}

module.exports.getWrapper = getWrapper;
