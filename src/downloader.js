const path = require('path')
const fs = require('fs-extra')
const homedir = require('homedir')
const req = require('superagent')

async function downloader(compilerVersion) {

  const dir = path.join(homedir(), '.tronbox', 'solc')
  const soljsonPath = path.join(dir, `soljson_v${compilerVersion}.js`)

  await fs.ensureDir(path.join(dir))

  const res = await req.get(`https://tronsuper.github.io/tron-solc-bin/bin/soljson_v${compilerVersion}.js`)
    .responseType('blob')

  if (res && res.body) {
    await fs.writeFile(soljsonPath, res.body)
    // double check
    if (!fs.existsSync(soljsonPath)) {
      console.error('Error. Permission required.')
    } else {
      console.info('Compiler downloaded.')
    }
  } else {
    console.error('Error. Wrong Solidity compiler version.')
  }
  // eslint-disable-next-line no-process-exit
  process.exit()
}

module.exports = downloader

