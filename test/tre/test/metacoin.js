const wait = require('./helpers/wait');
const chalk = require('chalk');
const MetaCoin = artifacts.require('./MetaCoin.sol');

// The following tests require TronBox >= 2.1.x
// and TronBox Runtime Environment (https://hub.docker.com/r/tronbox/tre)

contract('MetaCoin', function (accounts) {
  let meta;

  before(async function () {
    meta = await MetaCoin.deployed();
    if (accounts.length < 3) {
      // Set your own accounts if you are not using TronBox Runtime Environment
    }
  });

  it('should verify that there are at least three available accounts', async function () {
    if (accounts.length < 3) {
      console.info(
        chalk.blue(
          '\nYOUR ATTENTION, PLEASE.]\nTo test MetaCoin you should use TronBox Runtime Environment (https://hub.docker.com/r/tronbox/tre) as your private network.\nAlternatively, you must set your own accounts in the "before" statement in "test/metacoin.js".\n'
        )
      );
    }
    assert.isTrue(accounts.length >= 3);
  });

  it('should verify that the contract has been deployed by accounts[0]', async function () {
    assert.equal(await meta.getOwner(), tronWeb.address.toHex(accounts[0]));
  });

  it('should put 10000 MetaCoin in the first account', async function () {
    const balance = await meta.getBalance(accounts[0], { from: accounts[0] });
    assert.equal(balance, 10000n, "10000 wasn't in the first account");
  });

  it('should send coins from account 0 to 1', async function () {
    assert.isTrue(accounts[1] ? true : false, 'accounts[1] does not exist. Use TronBox Runtime Environment!');

    this.timeout(10000);
    const meta = await MetaCoin.deployed();
    await wait(3);
    const account_one_starting_balance = await meta.getBalance.call(accounts[0]);
    const account_two_starting_balance = await meta.getBalance.call(accounts[1]);
    await meta.sendCoin(accounts[1], 10, {
      from: accounts[0]
    });
    await wait(3);
    assert.equal(
      await meta.getBalance.call(accounts[0]),
      account_one_starting_balance - 10n,
      "Amount wasn't correctly taken from the sender"
    );
    assert.equal(
      await meta.getBalance.call(accounts[1]),
      account_two_starting_balance + 10n,
      "Amount wasn't correctly sent to the receiver"
    );
  });
});
