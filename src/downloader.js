const chalk = require('chalk');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs-extra');
const homedir = require('homedir');
const req = require('axios');

function fatal(msg) {
  process.stderr.write(chalk.red(chalk.bold('ERROR:'), msg) + '\n');
  process.exit(1);
}

async function downloader(compilerVersion, evm) {
  const dir = path.join(homedir(), '.tronbox', evm ? 'evm-solc' : 'solc');
  const soljsonPath = path.join(dir, `soljson_v${compilerVersion}.js`);

  await fs.ensureDir(dir);

  let soljsonUrl = '';
  let expectedSha256 = '';

  const solidityUrl = evm ? 'https://binaries.soliditylang.org/bin' : 'https://tronprotocol.github.io/solc-bin/wasm';

  let list;
  try {
    list = (await req.get(`${solidityUrl}/list.json`)).data;
  } catch {
    fatal('Failed to fetch Solidity compiler list.');
  }

  const builds = list?.builds;
  const build = evm
    ? builds?.find(b => b.path === list?.releases?.[compilerVersion])
    : builds?.find(b => b.version === compilerVersion);

  if (build) {
    expectedSha256 = build.sha256;
    soljsonUrl = `${solidityUrl}/${build.path}`;
  }

  if (!soljsonUrl) {
    fatal(`Unable to locate Solidity compiler version ${chalk.yellow(compilerVersion)}.`);
  }

  try {
    const res = await req.get(soljsonUrl, { responseType: 'arraybuffer' });

    if (res && res.data) {
      const tempFilePath = `${soljsonPath}.tmp`;
      await fs.writeFile(tempFilePath, res.data);

      if (!fs.existsSync(tempFilePath)) {
        fatal(
          'Permission required.\n\n' +
            'Most likely, you installed Node.js as root.\n' +
            'Please, download the compiler manually, running:\n\n' +
            `tronbox --download-compiler ${compilerVersion} ${evm ? '--evm' : ''}`
        );
      }

      const fileBuffer = await fs.readFile(tempFilePath);
      const hash = '0x' + crypto.createHash('sha256').update(fileBuffer).digest('hex');
      if (hash === expectedSha256) {
        await fs.rename(tempFilePath, soljsonPath);
        process.stdout.write('Compiler downloaded.\n');
      } else {
        await fs.remove(tempFilePath);
        fatal('SHA256 checksum mismatch. The downloaded file has been deleted.');
      }
    }
  } catch (error) {
    if (error.message) {
      fatal(error.message);
    }
    fatal('Wrong Solidity compiler version.');
  }
}

module.exports = downloader;
