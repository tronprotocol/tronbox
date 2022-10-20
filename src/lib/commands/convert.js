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
      return new Promise((resolve, reject) => {
        const request = require('request');
        request.get('https://raw.githubusercontent.com/tronsuper/bare-box/master/tronbox.js')
          .pipe(fs.createWriteStream(path.join(process.cwd(), './tronbox-config.js')))
          .on('close', () => {
            resolve();
          });
      });
    }

    function convertTests() {
      const testDirPath = path.join(process.cwd(), './test');
      if (!fs.existsSync(testDirPath)) return;
      const stats = fs.statSync(testDirPath);
      if (!stats.isDirectory()) return;

      const gogocode = require('gogocode');
      console.log(gogocode)
      function translateTestFile(file) {
        const content = fs.readFileSync(file).toString();
        const translatedContent = gogocode(content)
          .replace('web3', 'tronWeb')
          .replace('tronWeb.eth', 'tronWeb.trx')
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
