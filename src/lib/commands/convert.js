const command = {
  command: "init",
  description: "Initialize new and empty tronBox project",
  builder: {},
  run: function (options, done) {
    const fs = require("fs");
    const path = require("path");
    const Config = require('../../components/Config');
    const config = Config.default().with({
      logger: console
    });
    if (!fs.existsSync(path.join(process.cwd(), "./truffle-config.js"))) {
      config.logger.log('It\'s not a truffle project. Will start `tronbox init`');
      const InitCommand = require('./init');
      return InitCommand.run(options, done);
    }

    if (fs.existsSync(path.resolve(process.cwd(), './tronbox-config.js'))) {
      config.logger.log('It\'s already a tronbox project.');
      return;
    }

    function downloadConfig() {
      function downloadFile(url, target) {
        return new Promise((resolve, reject) => {
          const request = require('request');
          request.get(url)
            .pipe(fs.createWriteStream(target))
            .on('close', resolve)
            .on('error', reject);
        });
      }
      const configFilePromise = downloadFile(
        'https://raw.githubusercontent.com/tronsuper/bare-box/master/tronbox.js',
        path.join(process.cwd(), './tronbox-config.js')
      );
      const migrationFilePromise = downloadFile(
        'https://raw.githubusercontent.com/Tronbox-boxes/metacoin-box/master/contracts/Migrations.sol',
        path.join(process.cwd(), './contracts/Migrations.sol')
      );
      const migrationDeployFilePromise = downloadFile(
        'https://raw.githubusercontent.com/Tronbox-boxes/metacoin-box/master/migrations/1_initial_migration.js',
        path.join(process.cwd(), './migrations/1_initial_migration.js')
      );
      return Promise.all([
        configFilePromise,
        migrationFilePromise,
        migrationDeployFilePromise
      ]);
    }

    function convertTests() {
      const testDirPath = path.join(process.cwd(), './test');
      if (!fs.existsSync(testDirPath)) return;
      const stats = fs.statSync(testDirPath);
      if (!stats.isDirectory()) return;

      const gogocode = require('gogocode');
      function translateTestFile(file) {
        const content = fs.readFileSync(file).toString();
        const translatedContent = gogocode(content)
          .replace('$_$.new()', '$_$.deployed()')
          .replace('web3', 'tronWeb')
          .replace('tronWeb.eth', 'tronWeb.trx')
          .replace('tronWeb.eth.getBalance', 'tronWeb.trx.getBalance')
          .replace('tronWeb.eth.getBlock', 'tronWeb.trx.getBlock')
          .replace('tronWeb.eth.getBlockTransactionCount', 'tronWeb.trx.getBlockTransactionCount')
          .replace('tronWeb.eth.getTransaction', 'tronWeb.trx.getTransaction')
          .replace('tronWeb.eth.getTransactionFromBlock', 'tronWeb.trx.getTransactionFromBlock')
          .replace('tronWeb.eth.getTransactionReceipt', 'tronWeb.trx.getTransactionInfo')
          .replace('tronWeb.eth.sendTransaction', 'tronWeb.trx.sendTransaction')
          .replace('tronWeb.eth.sign', 'tronWeb.trx.sign')
          .replace('tronWeb.utils.sha3', 'tronWeb.sha3')
          // .replace('tronWeb.utils.toWei', 'tronWeb.toSun')
          // .replace('tronWeb.utils.fromWei', 'tronWeb.fromSun')
          .replace('tronWeb.utils.isAddress', 'tronWeb.isAddress')
          .replace('tronWeb.utils.toHex', 'tronWeb.toHex')
          .replace('tronWeb.utils.toBN', 'tronWeb.toBigNumber')
          .replace('tronWeb.utils.hexToNumber', 'tronWeb.toDecimal')
          .replace('tronWeb.utils.numberToHex', 'tronWeb.toHex')
          .replace('tronWeb.utils.hexToUtf8', 'tronWeb.toUtf8')
          .replace('tronWeb.utils.hexToAscii', 'tronWeb.toAscii')
          .replace('tronWeb.utils.utf8ToHex', 'tronWeb.fromUtf8')
          .replace('tronWeb.utils.asciiToHex', 'tronWeb.fromAscii')
          .root()
          .generate();
        if (content === translatedContent) return;
        fs.writeFileSync(file, translatedContent);
        config.logger.log(`convert file ${file} successful`);
      }

      function walkTestDir(dir) {
        const files = fs.readdirSync(dir);
        files.forEach((file) => {
          const currentFile = path.join(dir, file);
          const stats = fs.statSync(currentFile);
          if (stats.isDirectory()) return walkTestDir(currentFile);
          if (!stats.isFile()) return;
          if (path.extname(currentFile) !== '.js') return;
          translateTestFile(currentFile);
        });
      }

      walkTestDir(testDirPath);
    }

    downloadConfig()
      .then(() => {
        config.logger.log('OK. Convertion is done. Enjoy tronbox!');
        config.logger.log();
        done();
      });
    convertTests();
    
  },
};

module.exports = command;
