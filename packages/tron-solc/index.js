var wrapper = require('solc/wrapper');

var supportedVersions = [
  '0.4.24', '0.4.25', '0.5.4', '0.5.8'
]

var fullVersions = [
  '0.4.24-develop.2018.8.28+commit.3ba0cdec.mod.Emscripten.clang',
  '0.4.25+commit.69a1e720.Emscripten.clang',
  '0.5.4+commit.7b0de266.mod.Emscripten.clang',
  '0.5.8+commit.1f148fe1.Emscripten.clang'
]

function getWrapper(options = {}) {

  let compilerVersion = supportedVersions[supportedVersions.length - 1]

  if (options.networks) {
    if (options.networks.useZeroFourCompiler) {
      compilerVersion = '0.4.25'
    } else if (options.networks.useZeroFiveCompiler) {
      compilerVersion = '0.5.4'
    }

    try {
      let version = options.networks.compilers.solc.version
      if (supportedVersions.includes(version)) {
        compilerVersion = version
      } else {
        console.error(`Configuration error in "tronbox.js":
TronBox supports only the following versions:
${supportedVersions.join(', ')}
`)
        process.exit()
      }
    } catch(e) {
    }
  }

  let soljson = require(`./compiler-versions/soljson_v${compilerVersion}.js`)
  return wrapper(soljson)
}

module.exports.getWrapper = getWrapper;
module.exports.supportedVersions = supportedVersions;
