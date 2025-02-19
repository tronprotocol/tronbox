const { admin } = require('@openzeppelin/truffle-upgrades');
const ProxyAdmin = artifacts.require(
  '@openzeppelin/upgrades-core/artifacts/@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol/ProxyAdmin.json'
);
const Box = artifacts.require('TransparentBox');
const BoxV2 = artifacts.require('TransparentBoxV2');

module.exports = async function (deployer) {
  try {
    // Deploy the new BoxV2 implementation contract
    await deployer.deploy(BoxV2);

    // Upgrade proxy contract by admin
    const adminIns = await admin.getInstance();
    const adminContract = await ProxyAdmin.at(adminIns.address);
    await adminContract.upgrade(Box.address, BoxV2.address);
    console.info('Upgraded', Box.address);

    // Call proxy contract
    const box = await BoxV2.at(Box.address);
    const beforeValue = await box.value();
    console.info('Value before', beforeValue);

    // Set new Value
    await box.setValue(beforeValue + 100n);
    const afterValue = await box.value();
    console.info('Value after', afterValue);

    // Read new V2 Value
    const beforeValueV2 = await box.valueV2();
    console.info('ValueV2 before', beforeValueV2);

    // Set new V2 Value
    await box.setValueV2(beforeValueV2 + 100n);
    const afterValueV2 = await box.valueV2();
    console.info('ValueV2 after', afterValueV2);
  } catch (error) {
    console.error('Transparent: upgrade box error', error);
  }
};
