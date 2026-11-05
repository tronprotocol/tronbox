const Empty = artifacts.require('./Empty.sol');

contract('Empty', function () {
  it('is deployed and has an address', async function () {
    const empty = await Empty.deployed();
    assert.isOk(empty.address);
  });

  it('exposes tronWeb in the test context', function () {
    assert.isOk(typeof tronWeb !== 'undefined');
  });

  it('should read defaultPrivateKey as false', async function () {
    assert.strictEqual(tronWeb.defaultPrivateKey, false);
    assert.strictEqual(tronWeb.trx.tronWeb.defaultPrivateKey, false);
    assert.strictEqual(tronWeb.trx.raw.tronWeb.defaultPrivateKey, false);
    assert.strictEqual(tronWeb._privateKeyByAccount, undefined);
  });
});
