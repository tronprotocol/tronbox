const MetaCoin = artifacts.require('./MetaCoin.sol')

module.exports = function(deployer) {
  deployer.deploy(MetaCoin, 10000)
}
