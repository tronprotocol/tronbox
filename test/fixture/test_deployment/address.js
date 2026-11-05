const Empty = artifacts.require('./Empty.sol');

contract('Deployment address', function () {
  it('rejects a response for a different contract address', async function () {
    const existing = await Empty.deployed();
    const actualAddress = tronWrap.address.toHex(existing.address);
    const getContract = tronWrap.trx.getContract;
    const sendRawTransaction = tronWrap.trx.sendRawTransaction;
    let expectedAddress;
    let transactionId;

    tronWrap.trx.sendRawTransaction = function (transaction) {
      expectedAddress = tronWrap.address.toHex(transaction.contract_address);
      transactionId = transaction.txID;
      return sendRawTransaction(transaction);
    };
    tronWrap.trx.getContract = async function (address) {
      const response = await getContract(address);
      return { ...response, contract_address: actualAddress };
    };

    let error;
    try {
      await Empty.new();
    } catch (err) {
      error = err;
    } finally {
      tronWrap.trx.getContract = getContract;
      tronWrap.trx.sendRawTransaction = sendRawTransaction;
    }

    assert.isOk(error, 'Deployment unexpectedly succeeded');
    assert.isString(expectedAddress);
    assert.isString(transactionId);
    assert.notStrictEqual(expectedAddress, actualAddress);
    assert.strictEqual(
      error.message,
      `Error: Contract address mismatch: expected ${expectedAddress}, got ${actualAddress}. ` +
        `Transaction: ${transactionId}`
    );
  });
});
