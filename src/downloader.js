const chalk = require('chalk');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs-extra');
const homedir = require('homedir');
const req = require('axios');

async function downloader(compilerVersion, evm) {
  const dir = path.join(homedir(), '.tronbox', evm ? 'evm-solc' : 'solc');
  const soljsonPath = path.join(dir, `soljson_v${compilerVersion}.js`);

  await fs.ensureDir(path.join(dir));

  let soljsonUrl = '';
  let expectedSha256 = '';
  if (evm) {
    try {
      const solidityUrl = 'https://binaries.soliditylang.org/bin';
      const list = await req.get(`${solidityUrl}/list.json`);
      if (list && list.data) {
        if (list.data.builds && list.data.releases && list.data.releases[compilerVersion]) {
          const releasePath = list.data.releases[compilerVersion];
          list.data.builds.forEach(_ => {
            const { sha256, path: buildPath } = _;
            if (buildPath === releasePath) {
              expectedSha256 = sha256;
              soljsonUrl = `${solidityUrl}/${buildPath}`;
            }
          });
        } else {
          process.stderr.write(
            chalk.red(
              chalk.bold('Error:'),
              `Unable to locate Solidity compiler version ${chalk.yellow(compilerVersion)}.`
            ) + '\n'
          );

          process.exit(1);
        }
      }
    } catch (error) {
      process.stderr.write(chalk.red(chalk.bold('Error:'), 'Failed to fetch Solidity compiler list.') + '\n');
      process.exit(1);
    }
  } else {
    try {
      const solidityUrl = 'https://tronprotocol.github.io/solc-bin/wasm';
      const list = await req.get(`${solidityUrl}/list.json`);
      if (list && list.data && list.data.builds) {
        list.data.builds.forEach(_ => {
          const { version, sha256, path } = _;
          if (version === compilerVersion) {
            expectedSha256 = sha256;
            soljsonUrl = `${solidityUrl}/${path}`;
          }
        });
        if (!soljsonUrl) {
          process.stderr.write(
            chalk.red(
              chalk.bold('Error:'),
              `Unable to locate Solidity compiler version ${chalk.yellow(compilerVersion)}.`
            ) + '\n'
          );
          process.exit(1);
        }
      }
    } catch (error) {
      process.stderr.write(chalk.red(chalk.bold('Error:'), 'Failed to fetch Solidity compiler list.') + '\n');
      process.exit(1);
    }
  }

  try {
    const res = await req.get(soljsonUrl, {
      responseType: 'arraybuffer'
    });

    if (res && res.data) {
      await fs.writeFile(soljsonPath, res.data);
      // double check
      if (!fs.existsSync(soljsonPath)) {
        process.stderr.write(chalk.red(chalk.bold('Error:'), 'Permission required.') + '\n');
        process.stderr.write(`
Most likely, you installed Node.js as root.
Please, download the compiler manually, running:

tronbox --download-compiler ${compilerVersion} ${evm ? '--evm' : ''}
`);
      } else {
        const fileBuffer = await fs.readFile(soljsonPath);
        const hash = '0x' + crypto.createHash('sha256').update(fileBuffer).digest('hex');
        if (hash === expectedSha256) {
          process.stdout.write('Compiler downloaded.\n');
        } else {
          await fs.remove(soljsonPath);
          process.stderr.write(
            chalk.red(chalk.bold('Error:'), 'SHA256 checksum mismatch. The downloaded file has been deleted.') + '\n'
          );
          process.exit(1);
        }
      }
    }
  } catch (error) {
    process.stderr.write(chalk.red(chalk.bold('Error:'), 'Wrong Solidity compiler version.') + '\n');
    process.exit(1);
  }
}

module.exports = downloader;
