const command = {
  command: 'serve',
  description: 'Serve the build directory on localhost and watch for changes',
  builder: {
    port: {
      alias: 'p',
      default: '8080'
    }
  },
  run: function (options, done) {
    process.env.CURRENT = 'serve'
    const Serve = require('../serve')
    const Config = require('../../components/Config')
    const watch = require('./watch')

    const config = Config.detect(options)
    Serve.start(config, function () {
      watch.run(options, done)
    })
  }
}

module.exports = command
