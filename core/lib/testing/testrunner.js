var Config = require("../../components/Config");
var Migrate = require("../../components/Migrate");
var TestResolver = require("./testresolver");
var TestSource = require("./testsource");
var expect = require("truffle-expect");
var contract = require("../../components/Contract");
var path = require("path");
var _ = require("lodash");
var async = require("async");
var fs = require("fs");
var TronWrap = require('../../components/TronWrap');
var TronWeb = require("tronweb");
var waitForTransactionReceipt = require('./waitForTransactionReceipt');

function TestRunner(options) {
  options = options || {};

  expect.options(options, [
    "resolver",
    "provider",
    "contracts_build_directory"
  ]);

  this.config = Config.default().merge(options);

  this.logger = options.logger || console;
  this.initial_resolver = options.resolver;
  this.provider = options.provider;

  this.can_snapshot = false;
  this.first_snapshot = false;
  this.initial_snapshot = null;
  this.known_events = {};
  this.tronwrap = TronWrap();

  global.tronWeb = new TronWeb(
    this.tronwrap.fullNode,
    this.tronwrap.solidityNode,
    this.tronwrap.eventServer,
    this.tronwrap.defaultPrivateKey
  )

  global.waitForTransactionReceipt = waitForTransactionReceipt(tronWeb)

  // For each test
  this.currentTestStartBlock = null;

  this.BEFORE_TIMEOUT = 120000;
  this.TEST_TIMEOUT = 300000;
};

TestRunner.prototype.initialize = function(callback) {
  var self = this;

  var test_source = new TestSource(self.config);
  this.config.resolver = new TestResolver(self.initial_resolver, test_source, self.config.contracts_build_directory);

  var afterStateReset = function(err) {
    if (err) return callback(err);

    fs.readdir(self.config.contracts_build_directory, function(err, files) {
      if (err) return callback(err);

      files = _.filter(files, function(file) {
        return path.extname(file) === ".json"
      });

      async.map(files, function(file, finished) {
        fs.readFile(path.join(self.config.contracts_build_directory, file), "utf8", finished);
      }, function(err, data) {
        if (err) return callback(err);

        var contracts = data.map(JSON.parse).map(contract);
        var abis = _.flatMap(contracts, "abi");

        abis.map(function(abi) {
          if (/event/i.test(abi.type)) {
            var signature = abi.name + "(" + _.map(abi.inputs, "type").join(",") + ")";
            self.known_events[self.tronwrap.sha3(signature)] = {
              signature: signature,
              abi_entry: abi
            };
          }
        });
        callback();
      });
    });
  };
  afterStateReset();
};

TestRunner.prototype.deploy = function(callback) {
  Migrate.run(this.config.with({
    reset: true,
    quiet: true
  }), callback);
};

TestRunner.prototype.resetState = function(callback) {
  var self = this;
  this.deploy(callback);
};

TestRunner.prototype.startTest = function(mocha, callback) {
  var self = this;
  callback();
};

TestRunner.prototype.endTest = function(mocha, callback) {
  var self = this;

  if (mocha.currentTest.state != "failed") {
    return callback();
  }
  callback();
};

TestRunner.prototype.snapshot = function(callback) {
  this.rpc("evm_snapshot", function(err, result) {
    if (err) return callback(err);
    callback(null, result.result);
  });
},

TestRunner.prototype.revert = function(snapshot_id, callback) {
  this.rpc("evm_revert", [snapshot_id], callback);
}

TestRunner.prototype.rpc = function(method, arg, cb) {
  var req = {
    jsonrpc: "2.0",
    method: method,
    id: new Date().getTime()
  };
  if (arguments.length == 3) {
    req.params = arg;
  } else {
    cb = arg;
  }

  var intermediary = function(err, result) {
    if (err != null) {
      cb(err);
      return;
    }

    if (result.error != null) {
      cb(new Error("RPC Error: " + (result.error.message || result.error)));
      return;
    }

    cb(null, result);
  };

  this.provider.sendAsync(req, intermediary);
};

module.exports = TestRunner;
