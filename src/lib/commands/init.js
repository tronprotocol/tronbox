const command = {
  command: 'init',
  description: 'Initialize new and empty tronBox project',
  builder: {},
  run: function (options, done) {
    const fs = require('fs');
    const path = require('path');
    if (fs.existsSync(path.resolve(process.cwd(), './truffle-config.js'))) {
      const ConvertCommand = require('./convert');
      return ConvertCommand.run(options, done);
    }
    process.env.CURRENT = 'init'
    const Config = require('../../components/Config')
    const OS = require('os')
    const UnboxCommand = require('./unbox')

    const config = Config.default().with({
      logger: console
    })

    if (options._ && options._.length > 0) {
      config.logger.log(
        'Error: `tronbox init` no longer accepts a project template name as an argument.'
      )
      config.logger.log()
      config.logger.log(
        ' - For an empty project, use `tronbox init` with no arguments' +
        OS.EOL +
        ' - Or, browse the tronbox Boxes at <https://github.com/tronsuper>!'
      )
      // eslint-disable-next-line no-process-exit
      process.exit(1)
    }

    const url = 'https://github.com/tronsuper/bare-box.git'
    options._ = [url]

    UnboxCommand.run(options, done)
  }
}

module.exports = command
