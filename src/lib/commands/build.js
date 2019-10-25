var command = {
  command: 'build',
  description: 'Execute build pipeline (if configuration present)',
  builder: {},
  run: function (options, done) {
    process.env.CURRENT = 'build'
    var Config = require('../../components/Config')
    var Build = require('../build')

    var config = Config.detect(options)
    Build.build(config, done)
  }
}

module.exports = command
