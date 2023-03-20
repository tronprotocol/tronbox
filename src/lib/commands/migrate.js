const command = {
  command: 'migrate',
  description: 'Run migrations to deploy contracts',
  builder: {
    reset: {
      type: 'boolean',
      default: false
    },
    'compile-all': {
      describe: 'recompile all contracts',
      type: 'boolean',
      default: false
    },
    // "dry-run": {
    //   describe: "Run migrations against an in-memory fork, for testing",
    //   type: "boolean",
    //   default: false
    // },
    f: {
      describe: 'Specify a migration number to run from',
      type: 'number'
    },
    to: {
      describe: 'Specify a migration number to run to',
      type: 'number'
    }
  },
  run: function (options, done) {
    process.env.CURRENT = 'migrate'
    const OS = require('os')
    const Config = require('../../components/Config')
    const Contracts = require('../../components/WorkflowCompile')
    const Migrate = require('../../components/Migrate')
    const Environment = require('../environment')
    const TronWrap = require('../../components/TronWrap')
    const {dlog} = require('../../components/TronWrap')
    const logErrorAndExit = require('../../components/TronWrap').logErrorAndExit

    const config = Config.detect(options)

    // if "development" exists, default to using that
    if (!config.network && config.networks.development) {
      config.network = 'development'
    }
    // init TronWeb
    try {
      TronWrap(config.networks[config.network], {
        verify: true,
        log: options.log
      })
    } catch (err) {
      logErrorAndExit(console, err.message)
    }

    function runMigrations(callback) {
      if (options.f) {
        Migrate.runFrom(options.f, config, done)
      } else {
        Migrate.needsMigrating(config, function (err, needsMigrating) {
          if (err) return callback(err)

          if (needsMigrating) {
            dlog('Starting migration')
            Migrate.run(config, done)
          } else {
            config.logger.log('Network up to date.')
            callback()
          }
        })
      }
    }

    Contracts.compile(config, function (err) {
      if (err) return done(err)
      Environment.detect(config, function (err) {
        if (err) return done(err)
        const dryRun = options.dryRun === true

        let networkMessage = "Using network '" + config.network + "'"

        if (dryRun) {
          networkMessage += ' (dry run)'
        }

        config.logger.log(networkMessage + '.' + OS.EOL)
        runMigrations(done)
      })
    })
  }
}

module.exports = command
