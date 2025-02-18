const MetaCoin = artifacts.require('./MetaCoin.sol');

contract('MetaCoin', function (accounts) {
  let meta;

  before(async function () {
    meta = await MetaCoin.deployed();
  });

  it('should verify that the contract has been deployed by accounts[0]', async function () {
    assert.equal(await meta.getOwner(), web3.eth.accounts.wallet[0].address);
  });

  it('should put 10000 MetaCoin in the first account', async function () {
    const balance = await meta.getBalance(accounts[0], { from: accounts[0] });
    assert.equal(balance, 10000, "10000 wasn't in the first account");
  });

  it('should call a function that depends on a linked library', async function () {
    this.timeout(10000);
    const metaCoinBalance = await meta.getBalance.call(accounts[0]);
    const metaCoinConvertedBalance = await meta.getConvertedBalance.call(accounts[0]);
    assert.equal(
      metaCoinConvertedBalance,
      2n * metaCoinBalance,
      'Library function returned unexpected function, linkage may be broken'
    );
  });

  it('should send coins from account 0 to 1', async function () {
    const account1 = meta.address;
    const account_one_starting_balance = await meta.getBalance.call(accounts[0]);
    const account_two_starting_balance = await meta.getBalance.call(account1);
    await meta.sendCoin(account1, 10, {
      from: accounts[0]
    });
    assert.equal(
      await meta.getBalance.call(accounts[0]),
      account_one_starting_balance - 10n,
      "Amount wasn't correctly taken from the sender"
    );
    assert.equal(
      await meta.getBalance.call(account1),
      account_two_starting_balance + 10n,
      "Amount wasn't correctly sent to the receiver"
    );
  });
});
