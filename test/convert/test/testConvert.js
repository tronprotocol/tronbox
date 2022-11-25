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

  function jsonrpcRequest(method, params = [], X = 'post') {
    return tronWeb.fullNode.request(
      '/jsonrpc',
      {
        jsonrpc: '2.0',
        id: 1,
        method,
        params,
      },
      X
    ).then((resp) => resp.result);
  }

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
      const balance1 = await web3.eth.getBalance(accounts[2]);
      const balance2 = await jsonrpcRequest('eth_getBalance', [accounts[2]]);
      assert.equal(balance1, balance2, 'eth.getBalance should get the balance of accounts[2]');
    });

    it('should get the receipt', async () => {
      const metaCoinInstance = await MetaCoin.deployed();
      const sendCoinTxId = await metaCoinInstance.sendCoin(accounts[1], 10, { from: accounts[0] });
      await wait(3000); // wait for broadcasting
      const receipt1 = await web3.eth.getTransactionReceipt(sendCoinTxId);
      const receipt2 = await jsonrpcRequest('eth_getTransactionReceipt', [sendCoinTxId]);
      assert.equal(sendCoinTxId, receipt1.transactionHash.replace(/^0x/, ''), 'transaction receipt is not match');
      assert.equal(
        receipt1.transactionHash.replace(/^0x/, ''),
        receipt2.transactionHash.replace(/^0x/, ''),
        'transaction receipt is not match'
      );
    });

    it('should get the first block', async () => {
      const block1 = await web3.eth.getBlock(1);
      const block2 = await jsonrpcRequest('eth_getBlockByNumber', [1]);
      assert.equal(
        block1.block_header.raw_data.number,
        block2.block_header.raw_data.number,
        "did't get the right block"
      );
    });

    it('should get the protocol version', async () => {
      const protocolVersion1 = await web3.eth.getProtocolVersion();
      const protocolVersion2 = await jsonrpcRequest('eth_protocolVersion')
      assert.equal(protocolVersion1, protocolVersion2, 'protocol version not match');
    });

    it('should get accounts', async () => {
      const accounts_ = await web3.eth.getAccounts();
      assert(accounts_.length === 0, 'tron should return an empty array');
    });

    it('should get syncing status', async () => {
      const syncingStatus1 = await web3.eth.isSyncing();
      const syncingStatus2 = await jsonrpcRequest('eth_syncing');
      assert.deepEqual(syncingStatus1, syncingStatus2, 'did not get the syncing status');
    });

    it('should get storage at some where', async () => {
      const storedData1 = await web3.eth.getStorageAt(accounts[2]);
      const storedData2 = await jsonrpcRequest('eth_getStorageAt', [accounts[2]]);
      assert.deepEqual(storedData1, storedData2, 'did not get the right stored data');
    });
  });

  describe('test tre', () => {
    it('set account balance', async () => {
      const originBalance = await jsonrpcRequest('eth_getBalance', [accounts[2]]);
      console.log(originBalance);
      await provider.send('evm_setAccountBalance', [accounts[2], originBalance + 1]);
      await wait(6000);
      assert.equal(originBalance + 1, jsonrpcRequest('eth_getBalance', [accounts[2]]), 'set balance failed');
    });
  });
});

        