var fs = require('fs')
var path = require('path')
var MetaCoin = require('../build/contracts/MetaCoin')

const address = MetaCoin.networks['2'].address

console.log('The app has been configured.')
console.log('Run "npm run dev" to start it.')

const tronboxJs = require('../tronbox').networks.shasta
const metacoinConfig = {
  contractAddress: address,
  privateKey: tronboxJs.privateKey,
  fullHost: tronboxJs.fullHost
}

fs.writeFileSync(path.resolve(__dirname, '../src/js/metacoin-config.js'),`var metacoinConfig = ${JSON.stringify(metacoinConfig, null, 2)}`)
