const chalk = require('chalk');
const path = require('path');
const fs = require('fs-extra');
const homedir = require('homedir');
const req = require('superagent');

async function downloader(compilerVersion, evm) {
  const dir = path.join(homedir(), '.tronbox', evm ? 'evm-solc' : 'solc');
  const soljsonPath = path.join(dir, `soljson_v${compilerVersion}.js`);

  await fs.ensureDir(path.join(dir));

  let soljsonUrl = `https://tronsuper.github.io/tron-solc-bin/bin/soljson_v${compilerVersion}.js`;
  if (evm) {
    try {
      const solidityUrl = 'https://binaries.soliditylang.org/bin';
      const list = await req.get(`${solidityUrl}/list.json`);
      if (list && list.body) {
        if (list.body.releases && list.body.releases[compilerVersion]) {
          soljsonUrl = `${solidityUrl}/${list.body.releases[compilerVersion]}`;
        } else {
          console.info(chalk.red(chalk.bold('Error:'), 'Wrong Solidity compiler version.'));
          process.exit();
        }
      }
    } catch (error) {
      console.info(chalk.red(chalk.bold('Error:'), 'Failed to fetch compiler list.'));
      process.exit();
    }
  }

  try {
    const res = await req.get(soljsonUrl).responseType('blob');

    if (res && res.body) {
      await fs.writeFile(soljsonPath, res.body);
      // double check
      if (!fs.existsSync(soljsonPath)) {
        console.info(chalk.red(chalk.bold('Error:'), 'Permission required.'));
      } else {
        console.info('Compiler downloaded.');
      }
    }
  } catch (error) {
    console.info(chalk.red(chalk.bold('Error:'), 'Wrong Solidity compiler version.'));
    process.exit();
  }
}

module.exports = downloader;
