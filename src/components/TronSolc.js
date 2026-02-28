const { execFileSync } = require('child_process');
const { createRequire } = require('module');
const path = require('path');
const chalk = require('chalk');
const fs = require('fs-extra');
const homedir = require('homedir');
const wrapper = require('solc/wrapper');
let { name, version } = require('../../package');

const maxVersion = '0.8.25';

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

function getWrapper(options = {}) {
  let compilerVersion = maxVersion;
  const solcDir = path.join(homedir(), '.tronbox', options.evm ? 'evm-solc' : 'solc');

  if (options.networks) {
    if (options.networks.useZeroFourCompiler) {
      compilerVersion = '0.4.25';
    } else if (options.networks.useZeroFiveCompiler) {
      compilerVersion = '0.5.4';
    }
    try {
      if (options.networks.compilers) {
        compilerVersion = options.networks.compilers.solc.version;
      }
      if (options.compilers) {
        compilerVersion = options.compilers.solc.version;
      }

      if (!isValidCompilerVersion(compilerVersion)) {
        console.error(
          `${chalk.red(chalk.bold('Error:'))} Invalid compiler version '${chalk.yellow(compilerVersion)}'.`
        );
        process.exit(1);
      }

      if (compareVersions(compilerVersion, maxVersion) > 0 && !options.evm) {
        console.error(`${chalk.red(
          chalk.bold('Error:')
        )} TronBox v${version} currently supports Tron Solidity compiler versions up to ${chalk.green(maxVersion)}.
You are using version ${chalk.yellow(compilerVersion)}, which is not supported.`);
        process.exit(1);
      }
    } catch (e) {}
  }

  const soljsonPath = path.join(solcDir, `soljson_v${compilerVersion}.js`);

  if (!fs.existsSync(soljsonPath)) {
    if (process.argv[1]) {
      name = process.argv[1];
    }

    options.logger.log(`Fetching ${options.evm ? 'Ethereum' : 'Tron'} Solidity compiler version ${compilerVersion}...`);
    try {
      const args = ['--download-compiler', compilerVersion];
      if (options.evm) {
        args.push('--evm');
      }

      const result = execFileSync(name, args, {
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
  return wrapper(soljson);
}

module.exports.getWrapper = getWrapper;
module.exports.maxVersion = maxVersion;
