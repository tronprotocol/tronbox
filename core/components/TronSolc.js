var wrapper = require('solc/wrapper');
var {name} = require('../../package');
var path = require('path');
var fs = require('fs-extra');
var homedir = require('homedir');
const {execSync} = require('child_process')

var supportedVersions = [
  '0.4.24', '0.4.25', '0.5.4', '0.5.8', '0.5.9'
]

function getWrapper(options = {}) {

  let compilerVersion = '0.5.4'
  let solcDir = path.join(homedir(), '.tronbox', 'solc');

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
        console.error(`Error:
TronBox supports only the following versions:
${supportedVersions.join(', ')}
`)
        process.exit()
      }
    } catch (e) {
    }
  }

  let soljsonPath = path.join(solcDir, `soljson_v${compilerVersion}.js`)

  if (!fs.existsSync(soljsonPath)) {
    execSync(`${name} --download-compiler ${compilerVersion}`).toString()
  }
  let soljson = require(soljsonPath)
  return wrapper(soljson)
}

module.exports.getWrapper = getWrapper;
module.exports.supportedVersions = supportedVersions;
