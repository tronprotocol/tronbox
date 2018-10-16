tronbox is a development environment, testing framework andasset pipeline for tronweb. With tronbox, you get:

* Built-in smart contract compilation, linking, deployment and binary management.
* Automated contract testing with Mocha and Chai.
* Configurable build pipeline with support for custom build processes.
* Scriptable deployment & migrations framework.
* Network management for deploying to many public & private networks.
* Interactive console for direct contract communication.
* Instant rebuilding of assets during development.
* External script runner that executes scripts within a tronbox environment.

### Install

```
$ npm install -g tronbox
```

### Quick Usage

For a default set of contracts and tests, run the following within an empty project directory:

```
$ tronbox init
```

From there, you can run `tronbox compile`, `tronbox migrate` and `tronbox test` to compile your contracts, deploy those contracts to the network, and run their associated unit tests.

tronbox need localServer, FullNode 

+ wget https://raw.githubusercontent.com/tronprotocol/TronDeployment/master/deploy_tron.sh -O deploy_tron.sh
+ bash deploy_tron.sh --app FullNode --branch develop --net privatenet

more detail <https://github.com/tronprotocol/TronDeployment>


### Documentation

Please see the [Official tronweb Documentation](http://doc.tron.network/) for guides, tips, and examples.

### Contributing

This package is a distribution package of the tronbox command line tool. Please see [tronbox-core](https://github.com/simon4545/tronbox-core.git) to contribute to the main core code.

### Development

To contribute, fork this repo.
When done, clone it on your computer like in this example
```
git clone --recurse-submodules -j8 git@github.com:sullof/tron-box.git
cd tron-box
git remote add upstream git@github.com:tronprotocol/tron-box.git
npm run bootstrap
```

To pull latest version, run
```
git checkout master
git fetch upstream
git merge upstream/master --recurse-submodules
git submodule update --init --recursive
```

### License

MIT
