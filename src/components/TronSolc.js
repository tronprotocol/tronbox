const { execFileSync } = require('child_process');
const { createRequire } = require('module');
const path = require('path');
const chalk = require('chalk');
const fs = require('fs-extra');
const homedir = require('homedir');
const pkg = require('../lib/pkg');

const maxVersion = '0.8.31';

function compareVersions(version1, version2) {
  const v1Parts = version1.split('.').map(Number);
  const v2Parts = version2.split('.').map(Number);
  const maxLength = Math.max(v1Parts.length, v2Parts.length);
  for (let i = 0; i < maxLength; i++) {
    const v1 = v1Parts[i] || 0; // Treat missing parts as 0
    const v2 = v2Parts[i] || 0;
    if (v1 > v2) {
      return 1; // version1 is greater
    } else if (v1 < v2) {
      return -1; // version2 is greater
    }
    // If equal, continue to the next part
  }
  return 0; // Versions are equal
}

function isValidCompilerVersion(version) {
  return /^\d+\.\d+\.\d+$/.test(version);
}

// Adapted from solc-js (https://github.com/ethereum/solc-js): the bare minimum
// wrapping needed to drive a soljson module through Standard JSON I/O.
function wrapSoljson(solc) {
  const version = solc._solidity_version
    ? solc.cwrap('solidity_version', 'string', [])
    : solc.cwrap('version', 'string', []);
  const reset = solc._solidity_reset ? solc.cwrap('solidity_reset', null, []) : undefined;
  const isVersion6OrNewer = compareVersions(version(), '0.6.0') >= 0;

  let compile;
  if (isVersion6OrNewer && solc._solidity_compile) {
    compile = solc.cwrap('solidity_compile', 'string', ['string', 'number', 'number']);
  } else if (solc._solidity_compile) {
    compile = solc.cwrap('solidity_compile', 'string', ['string', 'number']);
  } else if (solc._compileStandard) {
    compile = solc.cwrap('compileStandard', 'string', ['string', 'number']);
  } else {
    throw new Error(`Invalid soljson compiler: missing compile entry point (version ${version()})`);
  }

  return {
    version,
    compile: input => {
      const output = isVersion6OrNewer ? compile(input, null, null) : compile(input, null);
      // cwrap's "compile" copies the returned pointer into a JS string and
      // there is no free() for it; reset() clears all allocations.
      if (reset) reset();
      return output;
    }
  };
}

function getWrapper(options = {}) {
  let compilerVersion = maxVersion;
  const solcDir = path.join(homedir(), '.tronbox', options.evm ? 'evm-solc' : 'solc');

  if (options.networks) {
    if (options.networks.useZeroFourCompiler) {
      compilerVersion = '0.4.25';
    } else if (options.networks.useZeroFiveCompiler) {
      compilerVersion = '0.5.4';
    }
    const networkVersion = options.networks.compilers?.solc?.version;
    const globalVersion = options.compilers?.solc?.version;
    if (globalVersion) {
      compilerVersion = globalVersion;
    } else if (networkVersion) {
      compilerVersion = networkVersion;
    }

    if (!isValidCompilerVersion(compilerVersion)) {
      console.error(`${chalk.red(chalk.bold('ERROR:'))} Invalid compiler version '${chalk.yellow(compilerVersion)}'.`);
      process.exit(1);
    }

    if (compareVersions(compilerVersion, maxVersion) > 0 && !options.evm) {
      console.error(`${chalk.red(chalk.bold('ERROR:'))} TronBox v${
        pkg.version
      } currently supports Tron Solidity compiler versions up to ${chalk.green(maxVersion)}.
You are using version ${chalk.yellow(compilerVersion)}, which is not supported.`);
      process.exit(1);
    }
  }

  const soljsonPath = path.join(solcDir, `soljson_v${compilerVersion}.js`);

  if (!fs.existsSync(soljsonPath)) {
    options.logger.log(`Fetching ${options.evm ? 'Ethereum' : 'Tron'} Solidity compiler version ${compilerVersion}...`);
    try {
      const args = ['--download-compiler', compilerVersion];
      if (options.evm) {
        args.push('--evm');
      }

      const result = execFileSync(process.execPath, [process.argv[1], ...args], {
        env: { ...process.env, FORCE_COLOR: '1' },
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe']
      });

      options.logger.log(result);
    } catch (error) {
      const errorOutput = error.stderr || error.stdout || error.message;
      console.error(errorOutput.trimEnd());
      process.exit(1);
    }
  }

  const runtimeRequire = createRequire(__filename);
  const soljson = runtimeRequire(soljsonPath);
  return wrapSoljson(soljson);
}

module.exports.getWrapper = getWrapper;
module.exports.maxVersion = maxVersion;
