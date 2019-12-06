const command = {
  command: 'compile',
  description: 'Compile contract source files',
  builder: {
    all: {
      type: 'boolean',
      default: false
    }
  },
  run: function (options, done) {
    process.env.CURRENT = 'compile'
    const Config = require('../../components/Config')
    const Contracts = require('../../components/WorkflowCompile')

    const config = Config.detect(options)
    Contracts.compile(config, done)
  }
}

module.exports = command
