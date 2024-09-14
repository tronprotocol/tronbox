const MyContract1 = artifacts.require('./MyContract1.sol');
const MyContract2 = artifacts.require('./MyContract2.sol');
const ConvertLib = artifacts.require('./ConvertLib.sol');
const MetaCoin = artifacts.require('./MetaCoin.sol');

module.exports = async function (deployer) {
  await deployer.deploy(MyContract1, 1);
  await deployer.deploy(MyContract2, 2, { value: 1 });

  await deployer.deploy(ConvertLib);
  deployer.link(ConvertLib, MetaCoin);
  await deployer.deploy(MetaCoin, 10000);
};
