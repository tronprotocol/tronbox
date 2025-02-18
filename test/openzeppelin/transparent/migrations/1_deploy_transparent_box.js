const { deployProxy } = require('@openzeppelin/truffle-upgrades');
const Box = artifacts.require('TransparentBox');

module.exports = async function (deployer) {
  try {
    // Setup tronbox deployer
    deployer.trufflePlugin = true;
    const instance = await deployProxy(Box, [42], { deployer });
    console.info('Deployed', instance.address);

    // Call proxy contract
    const box = await Box.deployed();
    const beforeValue = await box.value();
    console.info('Value before', beforeValue);

    // Set new Value
    await box.setValue(beforeValue + 100n);
    const afterValue = await box.value();
    console.info('Value after', afterValue);
  } catch (error) {
    console.error('Transparent: deploy box error', error);
  }
};
