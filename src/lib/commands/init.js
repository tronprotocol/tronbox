var command = {
  command: 'init',
  description: 'Initialize new and empty tronBox project',
  builder: {},
  run: function (options, done) {
    process.env.CURRENT = 'init'
    var Config = require('../../components/Config')
    var OS = require('os')
    var UnboxCommand = require('./unbox')

    var config = Config.default().with({
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
        ' - Or, browse the tronbox Boxes at <http://tronboxframework.com/boxes>!'
      )
      // eslint-disable-next-line no-process-exit
      process.exit(1)
    }

    var url = 'https://github.com/tronbox-boxes/bare-box.git'
    options._ = [url]

    UnboxCommand.run(options, done)
  }
}

module.exports = command
