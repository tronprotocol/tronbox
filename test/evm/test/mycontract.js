const MyContract1 = artifacts.require('./MyContract1.sol');
const MyContract2 = artifacts.require('./MyContract2.sol');

contract('MyContract', function (accounts) {
  let c1;
  let c2;

  before(async function () {
    c1 = await MyContract1.deployed();
    c2 = await MyContract2.deployed();
  });

  it('should check the initial value of the contract', async function () {
    assert.equal(await c1.myNumber(), 1, 'The value in MyContract1 should be 1');
    assert.equal(await c2.myNumber(), 2, 'The value in MyContract2 should be 2');
  });

  it('should check the initial balance of the contract', async function () {
    assert.equal(await c1.getBalance(c1.address), 0, 'The balance of MyContract1 should be 0');
    assert.equal(await c1.getBalance(c2.address), 1, 'The balance of MyContract2 should be 1');
  });

  it('should set the value in the contract', async function () {
    await c1.setMyNumber(100);
    assert.equal(await c1.myNumber(), 100, 'The value in MyContract1 should be set to 100');

    try {
      await c1.setMyNumber(200, { value: 1 });
    } catch {}
    assert.equal(await c1.myNumber(), 100, 'The value in MyContract1 should remain 100');
    assert.equal(await c1.getBalance(c1.address), 0, 'The balance of MyContract1 should be 0');

    await c2.setMyNumber(200);
    assert.equal(await c2.myNumber(), 200, 'The value in MyContract2 should be set to 200');
    await c2.setMyNumber(300, { value: 1 });
    assert.equal(await c2.myNumber(), 300, 'The value in MyContract2 should be set to 300');
    assert.equal(await c1.getBalance(c2.address), 2, 'The balance of MyContract2 should be 2');
  });

  it('should set the from', async function () {
    const sender1 = await c1.getSender();
    assert.equal(sender1, accounts[0], 'The sender should be accounts[0]');

    const from = '0x1234567890123456789012345678901234567890';
    const sender2 = await c1.getSender({ from });
    assert.equal(sender2, from, 'The sender should be 0x1234567890123456789012345678901234567890');
  });

  it('should return the contract address', async function () {
    const c1Address = await c1.myAddress();
    assert.equal(c1Address.toLowerCase(), c1.address, 'The address should be the address of MyContract1');

    const c2Ins = await c1.at(c2.address);
    const c2Address = await c2Ins.myAddress();
    assert.equal(c2Address.toLowerCase(), c2.address, 'The address should be the address of MyContract2');
  });
});
