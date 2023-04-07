const wait = require('./helpers/wait');
const MetaCoin = artifacts.require('./MetaCoin.sol');

// The following tests require TronBox >= 3.0.0
// and TronBox Runtime Environment (https://hub.docker.com/r/tronbox/tre)

contract('MetaCoin', function (accounts) {
  let meta;

  before(async function () {
    meta = await MetaCoin.deployed();
  });

  const getBlockNumber = async () => {
    const {
      block_header: {
        raw_data: { number }
      }
    } = await tronWrap.trx.getCurrentBlock();

    return number;
  };

  const generateAccount = async () => {
    const {
      address: { base58: account }
    } = tronWrap.utils.accounts.generateAccount();
    return account;
  };

  const getRuntimeCode = async address => {
    const { runtimecode = '' } = await this.tronWeb.solidityNode.request(
      'wallet/getcontractinfo',
      {
        value: tronWrap.address.toHex(address)
      },
      'post'
    );

    return `0x${runtimecode}`;
  };

  it('should successfully set account balance', async function () {
    const account = await generateAccount();
    const balance = 100;
    const beforeBalance = await tronWrap.trx.getBalance(account);
    const success = await tronWrap.send('tre_setAccountBalance', [account, balance]);
    await wait(3);
    const afterBalance = await tronWrap.trx.getBalance(account);
    const afterBalanceByMeta = await meta.getTrxBalance(account);
    assert.isTrue(success, 'The tre_setAccountBalance return value is incorrect');
    assert.equal(beforeBalance, 0, 'Balance is not 0');
    assert.equal(afterBalance, balance, 'Balance setting failed');
    assert.equal(afterBalanceByMeta[0].toNumber(), balance, 'Balance returned by the contract is incorrect');
  });

  it('should successfully set account code', async function () {
    const account = await generateAccount();
    const code = '0xbaddad42';
    const newCode =
      '0x6080604052348015600f57600080fd5b506004361060285760003560e01c80632ddbd13a14602d575b600080fd5b60336047565b604051603e9190604d565b60405180910390f35b60005481565b9081526020019056fea2646970667358221220c51fe6383da9d6d3eb400e2da0740e3bbcb4e1834682da9388000d75ec81741564736f6c63430008000033';
    const slot = '0x0000000000000000000000000000000000000000000000000000000000000000';
    const value = '0x0000000000000000000000000000000000000000000000000000000000000001';

    const beforeContract = await getRuntimeCode(account);
    await tronWrap.send('tre_setAccountCode', [account, code]);
    const afterContract = await getRuntimeCode(account);
    const setCodeSuccess = await tronWrap.send('tre_setAccountCode', [account, newCode]);
    const newContract = await getRuntimeCode(account);
    assert.isTrue(setCodeSuccess, 'The tre_setAccountCode return value is incorrect');
    assert.equal(beforeContract, '0x', 'Account already has code');
    assert.equal(afterContract, code, 'Code setting failed');
    assert.equal(newContract, newCode, 'Code replacement failed');

    const abi = [
      {
        inputs: [],
        name: 'total',
        outputs: [
          {
            internalType: 'uint256',
            name: '',
            type: 'uint256'
          }
        ],
        stateMutability: 'view',
        type: 'function'
      }
    ];
    const ins = await tronWrap.contract(abi, account);
    const beforeTotal = await ins.total().call();
    const setStorageSuccess = await tronWrap.send('tre_setAccountStorageAt', [account, slot, value]);
    const afterTotal = await ins.total().call();
    assert.isTrue(setStorageSuccess, 'The tre_setAccountStorageAt return value is incorrect');
    assert.equal(beforeTotal.toNumber(), 0, 'Total supply is not 0');
    assert.equal(afterTotal.toNumber(), 1, 'Total supply setting failed');
  });

  it('should successfully set block time', async function () {
    const success = await tronWrap.send('tre_blockTime', [0]);
    await wait(3);
    const beforeNumber = await getBlockNumber();
    await wait(10);
    const afterNumber = await getBlockNumber();
    const afterNumberByMeta = await meta.getBlockNumber();
    assert.isTrue(success, 'The tre_blockTime return value is incorrect');
    assert.equal(beforeNumber, afterNumber, 'Pause mining failed');
    assert.equal(afterNumber, afterNumberByMeta, 'Block number returned by the contract is incorrect');

    await tronWrap.send('tre_blockTime', [3]);
    await wait(10);
    const curNumber = await getBlockNumber();
    assert.isTrue(curNumber - afterNumber > 0, 'Block time setting failed');
  });

  it('should successfully mine some blocks', async function () {
    await tronWrap.send('tre_blockTime', [0]);
    await wait(3);
    const beforeNumber = await getBlockNumber();
    const success = await tronWrap.send('tre_mine', [{ blocks: 3 }]);
    await wait(10);
    const afterNumber = await getBlockNumber();
    assert.equal(success, '0x0', 'The tre_mine return value is incorrect');
    assert.equal(afterNumber - beforeNumber, 3, 'Mine blocks failed');
  });

  it('should successfully unlock some accounts', async function () {
    await tronWrap.send('tre_blockTime', [0]);

    const unlockedAccounts = [await generateAccount(), await generateAccount()];
    await tronWrap.send('tre_setAccountBalance', [unlockedAccounts[0], `0x${Number(1000 * 1e6).toString(16)}`]);
    await tronWrap.send('tre_unlockedAccounts', [[unlockedAccounts[0]]]);

    const { address } = await MetaCoin.new(10000, {
      from: unlockedAccounts[0]
    });
    MetaCoin.address = address;
    const unlockedMeta = await MetaCoin.deployed();

    const owner = await unlockedMeta.getOwner();
    assert.equal(owner, tronWrap.address.toHex(unlockedAccounts[0]), 'The owner is incorrect');

    const [msgSender1] = await unlockedMeta.getMsgSender();
    assert.equal(msgSender1, tronWrap.address.toHex(accounts[0]), 'The default msg.sender is incorrect');

    const [msgSender2] = await unlockedMeta.getMsgSender({
      from: unlockedAccounts[0]
    });
    assert.equal(msgSender2, tronWrap.address.toHex(unlockedAccounts[0]), 'The msg.sender is incorrect');

    await unlockedMeta.sendCoin(accounts[0], 10, {
      from: unlockedAccounts[0]
    });
    await wait(3);
    assert.equal(
      (await unlockedMeta.getBalance(unlockedAccounts[0])).toNumber(),
      9990,
      "Amount wasn't correctly taken from the sender"
    );
    assert.equal(
      (await unlockedMeta.getBalance(accounts[0])).toNumber(),
      10,
      "Amount wasn't correctly sent to the receiver"
    );

    await unlockedMeta.sendCoin(unlockedAccounts[1], 10);
    await wait(3);
    assert.equal(
      (await unlockedMeta.getBalance(accounts[0])).toNumber(),
      0,
      "Amount wasn't correctly taken from the sender"
    );
    assert.equal(
      (await unlockedMeta.getBalance(unlockedAccounts[1])).toNumber(),
      10,
      "Amount wasn't correctly sent to the receiver"
    );

    try {
      await unlockedMeta.sendCoin(accounts[0], 10, {
        from: unlockedAccounts[1]
      });
    } catch (error) {
      assert.equal(error, 'sender account not recognized');
    }
  });
});
