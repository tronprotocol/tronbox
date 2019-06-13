
var eth = {
        latestBlock : 2744
    },
    moment = require('moment'),
    BigNumber = require('bignumber.js');

// Mock the last ten blocks
var testBlock = {
        author: "0xbb7b8287f3f0a933474a79eae42cbca977791171",
        difficulty: 18118731572,
        extraData: "0x476574682f4c5649562f76312e302e302f6c696e75782f676f312e342e32",
        gasLimit: 5000,
        gasUsed: 0,
        hash: "0x37cb73b97d28b4c6530c925d669e4b0e07f16e4ff41f45d10d44f4c166d650e5",
        logsBloom: "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        miner: "0xbb7b8287f3f0a933474a79eae42cbca977791171",
        mixHash: "0x2e4b92a11b1bac2a311f6a47006442bf1dc689e76c9c1fee90da56ff6f2df7a7",
        nonce: "0x18c851620e8d6cb6",
        number: eth.latestBlock,
        parentHash: "0x701bc7632e80976d1a2c408ffa58e4f11aa3ed3c5a030d1125930a9d944e4343",
        receiptsRoot: "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
        sealFields: ["0x2e4b92a11b1bac2a311f6a47006442bf1dc689e76c9c1fee90da56ff6f2df7a7", "0x18c851620e8d6cb6"],
        sha3Uncles: "0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
        size: 542,
        stateRoot: "0x2d1e6407139174d74e9485ce0b9f80d31f6ec55f447708796d2582e3ffbdbb85",
        timestamp: 1438270492,
        totalDifficulty: 2181259381686,
        transactions: [],
        transactionsRoot: "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
        uncles: []
    },
    lastBlocks = {};

(function(){

    var startTime = moment().subtract(1, 'hours'),
        blocksToCreate = 9,
        blockNumber = testBlock.number - blocksToCreate;

    for(var i = eth.latestBlock - blocksToCreate; i <= eth.latestBlock; i++){

        var block = JSON.parse(JSON.stringify(testBlock));

        block.number = blockNumber;
        block.timestamp = startTime.add(parseInt((Math.random() * 30)), 'seconds').unix();

        // Need to assign a valid timestamp to each block as this is used to calculate difficulty in the
        // system stats library.
        lastBlocks[blockNumber] = block;
        blockNumber++;

    }

}());


eth.getSyncing = function(callBack){

    callBack(null, false);

};

eth.syncing = false;

// Get latest block
eth.getBlockNumber = function(callBack){

    var blockNumber = eth.latestBlock;
    callBack(null, blockNumber);

};

// Only retrieves block by number atm
eth.getBlock = function(blockNumber, populateTransactions, callBack){

    var block = lastBlocks[blockNumber];

    if(!block){
        return callBack('Block not found', null)
    }

    callBack(null, block);

};

eth.getGasPrice = function(callBack){

    var gasPrice = new BigNumber(10000000000);

    callBack(null, gasPrice);

};

eth.getTransaction = function(transactionHash, callBack){

    var transaction = {
        nonce: '0x6',
        gasPrice: '0x09184e72a000',
        gasLimit: '0x30000',
        to: '0xfa3caabc8eefec2b5e2895e5afbf79379e7268a7',
        value: '0x00'
    };

    callBack(null, transaction);

};

eth.getBalance = function(callback){

    var balance = new BigNumber(10000000);

    callback(null, balance);

};

eth.filter = function(filterString){

    var block = testBlock;

    return {

        watch : function(callback){

            block.number++;

            this.timer = setInterval(
                function(){
                    callback(null, block);
                }, 10
            )

        },
        stopWatching : function(){

            clearInterval(this.timer);

        }
    }

};

module.exports = eth;