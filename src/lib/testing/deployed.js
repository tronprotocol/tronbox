// Using web3 for its sha function...
const TronWrap = require('../../components/TronWrap')

const Deployed = {

  makeSolidityDeployedAddressesLibrary: function (mapping) {
    const self = this

    let source = ''
    source += 'pragma solidity ^0.4.17; \n\n library DeployedAddresses {' + '\n'

    Object.keys(mapping).forEach(function (name) {
      let address = mapping[name]

      let body = 'revert();'

      if (address) {
        address = self.toChecksumAddress(address.replace(/^(0x|41)/, '0x'))
        body = 'return ' + address + ';'
      }

      source += '  function ' + name + '() public pure returns (address) { ' + body + ' }'
      source += '\n'
    })

    source += '}'

    return source
  },

  // Pulled from ethereumjs-util, but I don't want all its dependencies at the moment.
  toChecksumAddress: function (address) {
    address = address.toLowerCase().replace('0x', '')
    const hash = TronWrap().sha3(address).replace('0x', '')
    let ret = '0x'

    for (let i = 0; i < address.length; i++) {
      if (parseInt(hash[i], 16) >= 8) {
        ret += address[i].toUpperCase()
      } else {
        ret += address[i]
      }
    }

    return ret
  }
}

module.exports = Deployed
