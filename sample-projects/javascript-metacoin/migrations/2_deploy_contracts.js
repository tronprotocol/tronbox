const ConvertLib = artifacts.require('./ConvertLib.sol');
const MetaCoin = artifacts.require('./MetaCoin.sol');

module.exports = async function (deployer, network) {
  await deployer.deploy(ConvertLib);
  await deployer.link(ConvertLib, MetaCoin);
  await deployer.deploy(MetaCoin, 10000);

  if (network === 'development' && typeof web3 === 'undefined') {
    // This code block is executed only when the network is 'development' as defined in tronbox-config.js
    const metaCoinInstance = await MetaCoin.deployed();

    const {
      block_header: {
        raw_data: { timestamp }
      }
    } = await tronWeb.trx.getCurrentBlock();
    const unlockTime = Math.round(timestamp / 1000) + 6;
    await metaCoinInstance.lock(unlockTime, { callValue: 1, feeLimit: 5000000 });
  }
};
