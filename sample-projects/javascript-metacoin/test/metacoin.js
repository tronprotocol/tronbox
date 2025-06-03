const wait = require('./helpers/wait');
const pc = require('picocolors');
const MetaCoin = artifacts.require('./MetaCoin.sol');

// The following tests require TronBox >= 4.1.x
// and TronBox Runtime Environment (https://hub.docker.com/r/tronbox/tre)

contract('MetaCoin', function (accounts) {
  let metaCoinInstance;

  before(async function () {
    metaCoinInstance = await MetaCoin.deployed();
  });

  it('should verify that there are at least two available accounts', async function () {
    if (accounts.length < 2) {
      console.info(
        pc.blue(
          '\n[YOUR ATTENTION, PLEASE.]\nTo test MetaCoin, use TronBox Runtime Environment (https://hub.docker.com/r/tronbox/tre) as your private network.'
        )
      );
    }
    assert.isTrue(accounts.length >= 2, 'At least two accounts are required for testing.');
  });

  it('should verify that the contract has been deployed by accounts[0]', async function () {
    assert.equal(
      await metaCoinInstance.getOwner(),
      tronWeb.address.toHex(accounts[0]),
      'Contract was not deployed by the owner.'
    );
  });

  it('should put 10000 MetaCoin in the first account', async function () {
    const balance = await metaCoinInstance.balanceOf(accounts[0], { from: accounts[0] });
    assert.equal(balance, 10000, "10000 wasn't in the first account");
  });

  it('should call a function that depends on a linked library', async function () {
    this.timeout(10000);
    const metaCoinBalance = await metaCoinInstance.balanceOf(accounts[0]);
    const metaCoinConvertedBalance = await metaCoinInstance.getConvertedBalance(accounts[0]);
    assert.equal(
      metaCoinConvertedBalance,
      2n * metaCoinBalance,
      'Library function returned unexpected function, linkage may be broken'
    );
  });

  it('should send coins from account 0 to 1', async function () {
    assert.isTrue(accounts[1] ? true : false, 'accounts[1] does not exist. Use TronBox Runtime Environment!');

    this.timeout(10000);
    const accountOneStartingBalance = await metaCoinInstance.balanceOf(accounts[0]);
    const accountTwoStartingBalance = await metaCoinInstance.balanceOf(accounts[1]);

    const amountToSend = 10;
    await metaCoinInstance.sendCoin(accounts[1], amountToSend, { from: accounts[0] });

    const accountOneFinalBalance = await metaCoinInstance.balanceOf(accounts[0]);
    const accountTwoFinalBalance = await metaCoinInstance.balanceOf(accounts[1]);

    assert.equal(
      accountOneFinalBalance,
      accountOneStartingBalance - BigInt(amountToSend),
      "Amount wasn't correctly taken from the sender."
    );
    assert.equal(
      accountTwoFinalBalance,
      accountTwoStartingBalance + BigInt(amountToSend),
      "Amount wasn't correctly sent to the receiver."
    );
  });

  it('should allow owner to withdraw TRX after unlock time', async function () {
    assert.isTrue(accounts[1] ? true : false, 'accounts[1] does not exist. Use TronBox Runtime Environment!');
    await wait(10);

    const initialReceiverBalance = await tronWeb.trx.getBalance(accounts[1]);
    const contractBalance = await tronWeb.trx.getBalance(metaCoinInstance.address);

    assert.equal(contractBalance, 1, 'Contract balance should be 1.');

    const withdrawTx = await metaCoinInstance.withdraw(accounts[1]);
    await waitForTransactionReceipt(withdrawTx);
    const withdrawTxInfo = await tronWeb.trx.getTransactionInfo(withdrawTx);
    assert.equal(withdrawTxInfo.receipt.result, 'SUCCESS', 'Withdraw transaction was not successful.');

    assert.equal(
      await tronWeb.trx.getBalance(accounts[1]),
      initialReceiverBalance + contractBalance,
      'Receiver balance should increase by the contract balance.'
    );
    assert.equal(
      await tronWeb.trx.getBalance(metaCoinInstance.address),
      0,
      'Contract balance should be 0 after withdrawal.'
    );

    const nonOwnerWithdrawTx = await metaCoinInstance.withdraw(accounts[1], { from: accounts[1] });
    await waitForTransactionReceipt(nonOwnerWithdrawTx);
    const nonOwnerWithdrawTxInfo = await tronWeb.trx.getTransactionInfo(nonOwnerWithdrawTx);
    assert.include(
      tronWeb.toUtf8(nonOwnerWithdrawTxInfo.contractResult[0].slice(8)),
      "You aren't the owner",
      'Withdrawing TRX by non-owner should have failed.'
    );
  });
});
