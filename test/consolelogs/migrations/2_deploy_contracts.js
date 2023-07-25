const AddressAddressLogs = artifacts.require('./AddressAddressLogs.sol');
const AddressBoolLogs = artifacts.require('./AddressBoolLogs.sol');
const AddressStringLogs = artifacts.require('./AddressStringLogs.sol');
const AddressUintLogs = artifacts.require('./AddressUintLogs.sol');
const BoolAddressLogs = artifacts.require('./BoolAddressLogs.sol');
const BoolBoolLogs = artifacts.require('./BoolBoolLogs.sol');
const BoolStringLogs = artifacts.require('./BoolStringLogs.sol');
const BoolUintLogs = artifacts.require('./BoolUintLogs.sol');
const StringAddressLogs = artifacts.require('./StringAddressLogs.sol');
const StringBoolLogs = artifacts.require('./StringBoolLogs.sol');
const StringStringLogs = artifacts.require('./StringStringLogs.sol');
const StringUintLogs = artifacts.require('./StringUintLogs.sol');
const UintAddressLogs = artifacts.require('./UintAddressLogs.sol');
const UintBoolLogs = artifacts.require('./UintBoolLogs.sol');
const UintStringLogs = artifacts.require('./UintStringLogs.sol');
const UintUintLogs = artifacts.require('./UintUintLogs.sol');
const SingleLogs = artifacts.require('./SingleLogs.sol');
const MostSignificantBitSetLogs = artifacts.require('./MostSignificantBitSetLogs.sol');
const CreationLogs = artifacts.require('./CreationLogs.sol');
const CreationRevertingLogs = artifacts.require('./CreationRevertingLogs.sol');
const CreationMultipleLogs = artifacts.require('./CreationMultipleLogs.sol');
const TriggerLogs = artifacts.require('./TriggerLogs.sol');

module.exports = async function (deployer) {
  // Skip deployment while testing
  if (global.config.test_files) {
    return;
  }
  const sleep = (millis = 3000) => {
    return new Promise(resolve => setTimeout(resolve, millis));
  };
  const setBalance = async () => {
    await tronWrap.send('tre_setAccountBalance', [tronWrap.defaultAddress.base58, 100000 * 1e6]);
  };
  const testCallLogs = async (contract, prefix = 'callLogs') => {
    await sleep();
    await deployer.deploy(contract);
    const logs = await contract.deployed();
    console.info(`=== ${prefix} start ===`);
    await logs.callLogs();
    console.info(`=== ${prefix} end ===`);
  };
  const testDeployLogs = async (contract, prefix = 'deployLogs') => {
    await sleep();
    console.info(`=== ${prefix} start ===`);
    try {
      await deployer.deploy(contract);
    } catch (e) {}
    console.info(`=== ${prefix} end ===`);
  };
  const testSendLogs = async (contract, func = 'sendLogs') => {
    await sleep();
    await deployer.deploy(contract);
    const logs = await contract.deployed();
    console.info(`=== ${func} start ===`);
    await logs[func]();
    console.info(`=== ${func} end ===`);
  };

  await setBalance();
  await testCallLogs(AddressAddressLogs, 'AddressAddress');
  await testCallLogs(AddressBoolLogs, 'AddressBool');
  await testCallLogs(AddressStringLogs, 'AddressString');
  await testCallLogs(AddressUintLogs, 'AddressUint');
  await testCallLogs(BoolAddressLogs, 'BoolAddress');
  await testCallLogs(BoolBoolLogs, 'BoolBool');
  await testCallLogs(BoolStringLogs, 'BoolString');
  await testCallLogs(BoolUintLogs, 'BoolUint');
  await testCallLogs(StringAddressLogs, 'StringAddress');
  await testCallLogs(StringBoolLogs, 'StringBool');
  await testCallLogs(StringStringLogs, 'StringString');
  await testCallLogs(StringUintLogs, 'StringUint');
  await testCallLogs(UintAddressLogs, 'UintAddress');
  await testCallLogs(UintBoolLogs, 'UintBool');
  await testCallLogs(UintStringLogs, 'UintString');
  await testCallLogs(UintUintLogs, 'UintUint');
  await testCallLogs(SingleLogs, 'Single');
  await testCallLogs(MostSignificantBitSetLogs, 'MostSignificantBitSet');

  await setBalance();
  await testDeployLogs(CreationLogs, 'Creation');
  await testDeployLogs(CreationRevertingLogs, 'CreationReverting');
  await testDeployLogs(CreationMultipleLogs, 'CreationMultiple');

  await testSendLogs(TriggerLogs, 'f1');
  await testSendLogs(TriggerLogs, 'f2');
};
