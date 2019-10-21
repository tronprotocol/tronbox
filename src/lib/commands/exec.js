var command = {
  command: 'exec',
  description: 'Execute a JS module within this tronBox environment',
  builder: {
    file: {
      type: "string"
    },
    c: {
      type: "boolean",
      default: false
    },
    compile: {
      type: "boolean",
      default: false
    }
  },
  run: function (options, done) {
    process.env.CURRENT = 'exec'
    var Config = require("../../components/Config");
    var Contracts = require("../../components/WorkflowCompile");
    var ConfigurationError = require("../errors/configurationerror");
    var Require = require("@truffle/expect");
    var Environment = require("../environment");
    var path = require("path");
    var OS = require("os");

    var config = Config.detect(options);

    var file = options.file;

    if (file == null && options._.length > 0) {
      file = options._[0];
    }

    if (file == null) {
      done(new ConfigurationError("Please specify a file, passing the path of the script you'd like the run. Note that all scripts *must* call process.exit() when finished."));
      return;
    }

    if (path.isAbsolute(file) == false) {
      file = path.join(process.cwd(), file);
    }

    Environment.detect(config, function(err) {
      if (err) return done(err);

      if (config.networkHint !== false) {
        config.logger.log("Using network '" + config.network + "'." + OS.EOL);
      }

      // `--compile`
      if (options.c || options.compile){
        return Contracts.compile(config, function(err){
          if(err) return done(err);

          Require.exec(config.with({
            file: file
          }), done);
        });
      };

      // Just exec
      Require.exec(config.with({
        file: file
      }), done);
    });
  }
}

module.exports = command;
