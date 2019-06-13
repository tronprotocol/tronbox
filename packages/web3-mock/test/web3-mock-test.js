
var chai = require('chai'),
    expect = chai.expect,
    Web3 = require('../lib/web3mock'),
    web3Test = null;

describe('Web3 mock module',
    function(){

        var latestBlockNumber = 2744; // Arbitrary.

        it('Should require a provider to be provided to the constructor',
            function(){

                expect(
                    function(){

                        Web3()

                    }
                ).to.throw();

            }
        );

        it('Should have an HttpProvider object',
            function(){

                expect(Web3.providers).to.not.be.undefined;

            }
        );

        it('Should require an argument to the HttpProvider constructor',
            function(){

                expect(
                    function(){

                        Web3.providers.HttpProvider();

                    }
                ).to.throw();

            }
        );

        it('Should connect to a web3 provider',
            function(){

                var nodeURI = 'http://localhost:8645';
                web3Test = new Web3(new Web3.providers.HttpProvider(nodeURI));

                expect(typeof web3Test.isConnected).to.equal('function');

            }
        );

        it('Should return whether it is connected to a blockchain',
            function(){

                expect(web3Test.isConnected()).to.equal(true);

            }
        );

        it('Should return whether the blockchain is syncing or not',
            function(done){

                web3Test.eth.getSyncing(
                    function(error, result){

                        expect(error).to.equal(null);
                        expect(result).to.equal(false);

                        expect(web3Test.eth.syncing).to.equal(false);

                        done();

                    }
                )

            }
        );

        it('Should get the latest block number',
            function(done){

                web3Test.eth.getBlockNumber(
                    function(error, result){

                        expect(error).to.equal(null);
                        expect(result).to.equal(latestBlockNumber);

                        done();
                    }
                )

            }
        );

        it('Should retrieve a given block by number',
            function(done){

                var blockNumber = latestBlockNumber - 3;

                web3Test.eth.getBlock(blockNumber,
                    function(error, block){

                        expect(error).to.equal(null);
                        expect(block.hash).to.equal("0x37cb73b97d28b4c6530c925d669e4b0e07f16e4ff41f45d10d44f4c166d650e5");

                        done();

                    }
                );

            }
        );

        it('Should retrieve the peer count',
            function(done){

                web3Test.net.getPeerCount(
                    function(error, result){

                        expect(error).to.equal(null);
                        expect(result).to.equal(120);

                        done();
                    }
                )

            }
        );

        it('Should retrieve the gas price',
            function(done){

                web3Test.eth.getGasPrice(
                    function(error, result){

                        expect(error).to.equal(null);
                        expect(result.toString(10)).to.equal('10000000000');

                        done()

                    }
                )

            }
        );

        it('Should retrieve a given transaction',
            function(done){

                var txHash = '0xaf4a217f6cc6f8c79530203372f3fbec160da83d1abe048625a390ba1705dd57';

                web3Test.eth.getTransaction(txHash,
                    function(error, transaction){

                        expect(error).to.equal(null);
                        expect(transaction.nonce).to.equal('0x6');

                        done();
                    }
                )


            }
        );

        it('Should determine if a string is an address',
            function(){

                expect(web3Test.isAddress()).to.equal(true);

            }
        );

        it('Should retrieve an account balance',
            function(done){

                web3Test.eth.getBalance(
                    function(error, balance){

                        expect(error).to.equal(null);
                        expect(balance.toString(10)).to.equal('10000000');

                        done();

                    }
                );

            }
        );

        var filter = null;

        it('Should start a watch for the latest block',
            function(done){

                filter = web3Test.eth.filter('latest');

                filter.watch(
                    function(error, result){

                        expect(error).to.equal(null);
                        done();
                    }
                )

            }
        );

        it('Should stop a watch for the latest block',
            function(){

                filter.stopWatching();

                // Not much to test here...

            }
        )

    }
);
