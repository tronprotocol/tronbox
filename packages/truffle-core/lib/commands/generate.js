var command = {
  command: 'generate',
  description: 'Generate an amount of Tron accounts for testing (default 10)',
  builder: {
    accounts: {
      describe: "number of accounts",
      type: "number",
      default: 10
    }
  },
  run: function (options, done) {
    var Config = require("truffle-config");
    var temp = require("temp");
    var TronWrap = require("TronWrap");
    var fs = require('fs-extra');
    var path = require('path');
    var accountGenerator = require('../testing/accountGenerator');

    var config = Config.detect(options);

    // if "development" exists, default to using that
    if (!config.network && config.networks.development) {
      config.network = "development";
    }
    TronWrap(config.networks[config.network]);

    const tmpDir = path.resolve(__dirname, '../../tmp')
    fs.ensureDirSync(tmpDir);


      accountGenerator.generate(options.accounts, tmpDir, config.network)
        .then(accounts => {

          console.log('\nAvailable Accounts')
          console.log('==================')

          for (let i = 0; i < accounts.length; i++) {
            console.log(`(${i}) ${accounts[i].address.base58} (~10000 TRX)`)
          }


          console.log('\nPrivate Keys')
          console.log('==================')

          for (let i = 0; i < accounts.length; i++) {
            console.log(`(${i}) ${accounts[i].privateKey}`)
          }
          console.log()
        })
  }
}

module.exports = command;
