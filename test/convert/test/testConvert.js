const MetaCoin = artifacts.require('MetaCoin');
const ganache = require('ganache');
const Web3 = require('web3');
var web3 = new Web3(Web3.givenProvider);
[web3, provider] = require('../../index')(web3, ganache.provider());

async function wait(time) {
  return new Promise(resolve => {
    setTimeout(resolve, time);
  });
}

contract('MetaCoinConvert', accounts => {
  describe('test utils', () => {
    it('function that tronWeb has: utils.sha3 ', async () => {
      let sha3_ = await web3.utils.sha3('234');
      assert.equal(sha3_, '0xc1912fee45d61c87cc5ea59dae311904cd86b84fee17cc96966216f811ce6a79', 'taken as string');
    });

    it('function only exist in web3.js: utils.soliditySha3 ', async () => {
      let soliditySha3_ = await web3.utils.soliditySha3('234');
      assert.equal(
        soliditySha3_,
        '0x61c831beab28d67d1bb40b5ae1a11e2757fa842f031a2d0bc94a7867bc5d26c2',
        'taken as string'
      );
    });

    it('function only exist in web3.js and tron will never use: utils.toChecksumAddress ', async () => {
      let toChecksumAddress_ = await web3.utils.toChecksumAddress('0xdde0b9023813b895a9b88bd623c843d6bcb42ff7');
      assert.equal(toChecksumAddress_, '0xddE0B9023813B895a9b88Bd623c843d6Bcb42fF7', 'checkSumAddress not match');
    });

    it('function accept chain specific argument(s): utils.isAddress ', async () => {
      let isAddress_ = await web3.utils.isAddress(accounts[0]);
      assert(isAddress_, 'accounts[0] should be an address');
    });

    it('test unit transformation: toWei', async () => {
      let toWei_ = await web3.utils.toWei('1', 'ether');
      assert.equal(toWei_, 1000000000000000000);
    });

    it('test unit transformation: fromWei', async () => {
      let fromWei = web3.utils.fromWei('1', 'ether');
      assert.equal(fromWei, 0.000000000000000001);
    });
  });

  describe('test eth', () => {
    it('should get the right balance', async () => {
      let balance2 = await web3.eth.getBalance(accounts[2]);
      assert(typeof balance2 === 'number', 'eth.getBalance should return a number');
    });

    it('should get the receipt', async () => {
      const metaCoinInstance = await MetaCoin.deployed();
      const sendCoinTxId = await metaCoinInstance.sendCoin(accounts[1], 10, { from: accounts[0] });
      await wait(3000); // wait for broadcasting
      const receipt = await web3.eth.getTransactionReceipt(sendCoinTxId);
      assert.equal(sendCoinTxId, receipt.transactionHash.replace(/^0x/, ''), 'transaction receipt is not match');
    });

    it('should get the first block', async () => {
      const block = await web3.eth.getBlock(1);
      assert.equal(1, block.block_header.raw_data.number, "did't get the right block");
    });

    it('should get the protocol version', async () => {
      const protocolVersion = await web3.eth.getProtocolVersion();
      assert.equal(0x18, protocolVersion, 'protocol version not match');
    });

    it('should get accounts', async () => {
      const accounts_ = await web3.eth.getAccounts();
      assert(accounts_.length === 0, 'tron should return an empty array');
    });

    it('should get syncing status', async () => {
      const syncingStatus = await web3.eth.isSyncing();
      assert(syncingStatus !== undefined, 'did not get the syncing status');
    });

    it('should get storage at some where', async () => {
      const storedData = await web3.eth.getStorageAt(accounts[2]);
      assert.equal(storedData, 1, 'did not get the right stored data');
    });
  });

  describe('test tre', () => {
    it('set account balance', async () => {
      const originBalance = await web3.eth.getBalance(accounts[2]);
      await provider.send('evm_setAccountBalance', [accounts[2], originBalance + 1]);
      await wait(6000);
      assert.equal(originBalance + 1, await web3.eth.getBalance(accounts[2]), 'set balance failed');
    });
  });
});
