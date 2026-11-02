const pc = require('picocolors');
const MetaCoin = artifacts.require('MetaCoin.sol');
const isEvm = typeof ethers !== 'undefined';

// Requires a local TRON development node or an EVM node, depending on the selected mode.

const sleep = async secs => {
  process.stdout.write(pc.yellow(`Sleeping for ${secs} second${secs === 1 ? '' : 's'}...`));
  await new Promise(resolve => setTimeout(resolve, secs * 1000));
  process.stdout.write(pc.yellow(' Slept.\n'));
};

contract('MetaCoin', function (accounts) {
  let metaCoinInstance;

  before(async function () {
    metaCoinInstance = await MetaCoin.deployed();
  });

  it('should verify that there are at least two available accounts', async function () {
    if (isEvm) this.skip();

    if (accounts.length < 2) {
      console.info(
        pc.blue(
          '\n[YOUR ATTENTION, PLEASE.]\nTo test MetaCoin, use a local TRON development node with at least two funded accounts. See README.md for setup instructions.'
        )
      );
    }
    assert.isTrue(accounts.length >= 2, 'At least two accounts are required for testing.');
  });

  it('should verify that the contract has been deployed by accounts[0]', async function () {
    const owner = isEvm ? accounts[0] : tronWeb.address.toHex(accounts[0]);
    assert.equal(await metaCoinInstance.getOwner(), owner, 'Contract was not deployed by the owner.');
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

  it('should send coins to another address', async function () {
    this.timeout(10000);

    const sender = accounts[0];
    const receiver = metaCoinInstance.address;

    const senderStartingBalance = await metaCoinInstance.balanceOf(sender);
    const receiverStartingBalance = await metaCoinInstance.balanceOf(receiver);

    const amountToSend = 10;
    await metaCoinInstance.sendCoin(receiver, amountToSend, { from: sender });

    const senderFinalBalance = await metaCoinInstance.balanceOf(sender);
    const receiverFinalBalance = await metaCoinInstance.balanceOf(receiver);

    assert.equal(
      senderFinalBalance,
      senderStartingBalance - BigInt(amountToSend),
      "Amount wasn't correctly taken from the sender."
    );
    assert.equal(
      receiverFinalBalance,
      receiverStartingBalance + BigInt(amountToSend),
      "Amount wasn't correctly sent to the receiver."
    );
  });

  it('should allow owner to withdraw TRX after unlock time', async function () {
    if (isEvm) this.skip();

    assert.isTrue(
      accounts[1] ? true : false,
      'accounts[1] does not exist. Use a local TRON development node with at least two funded accounts.'
    );
    await sleep(10);

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
