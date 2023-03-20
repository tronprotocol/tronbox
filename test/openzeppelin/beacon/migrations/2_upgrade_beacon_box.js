const UpgradeableBeacon = artifacts.require('@openzeppelin/upgrades-core/artifacts//@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol/UpgradeableBeacon.json')
const { erc1967 } = require('@openzeppelin/truffle-upgrades')

const Box = artifacts.require('BeaconBox')
const BoxV2 = artifacts.require('BeaconBoxV2')

module.exports = async function (deployer) {
  try {
    // Deploy the new BoxV2 implementation contract
    await deployer.deploy(BoxV2)
    const beaconAddress = await erc1967.getBeaconAddress(Box.address)

    // Upgrade proxy contract
    const proxyContract = await UpgradeableBeacon.at(beaconAddress)
    await proxyContract.upgradeTo(BoxV2.address)
    console.log('Upgraded', Box.address)

    // Call proxy contract
    const box = await BoxV2.at(Box.address)
    const beforeValue = await box.value()
    console.log('Value before', beforeValue.toNumber())

    // Set new Value
    await box.setValue(beforeValue.toNumber() + 100)
    const afterValue = await box.value()
    console.log('Value after', afterValue.toNumber())

    // Read new V2 Value
    const beforeValueV2 = await box.valueV2()
    console.log('ValueV2 before', beforeValueV2.toNumber())

    // Set new V2 Value
    await box.setValueV2(beforeValueV2.toNumber() + 100)
    const afterValueV2 = await box.valueV2()
    console.log('ValueV2 after', afterValueV2.toNumber())
  } catch (error) {
    console.log('UUPS: upgrade box error', error)
  }
}
