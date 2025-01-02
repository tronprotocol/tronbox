const mkdirp = require('mkdirp');
const del = require('del');
const Contracts = require('../components/WorkflowCompile');
const BuildError = require('./errors/builderror');
const child_process = require('child_process');
const spawnargs = require('spawn-args');
const _ = require('lodash');
const expect = require('@truffle/expect');

function CommandBuilder(command) {
  this.command = command;
}

CommandBuilder.prototype.build = function (options, callback) {
  console.debug('Running `' + this.command + '`...');

  const args = spawnargs(this.command);
  const ps = args.shift();

  const cmd = child_process.spawn(ps, args, {
    detached: false,
    cwd: options.working_directory,
    env: _.merge(process.env, {
      WORKING_DIRECTORY: options.working_directory,
      BUILD_DESTINATION_DIRECTORY: options.destination_directory,
      BUILD_CONTRACTS_DIRECTORY: options.contracts_build_directory
    })
  });

  cmd.stdout.on('data', function (data) {
    console.debug(data.toString());
  });

  cmd.stderr.on('data', function (data) {
    console.debug('build error: ' + data);
  });

  cmd.on('close', function (code) {
    let error = null;
    if (code !== 0) {
      error = 'Command exited with code ' + code;
    }
    callback(error);
  });
};

const Build = {
  clean: function (options, callback) {
    const destination = options.build_directory;
    const contracts_build_directory = options.contracts_build_directory;

    // Clean first.
    del([destination + '/*', '!' + contracts_build_directory]).then(function () {
      mkdirp(destination, callback);
    });
  },

  // Note: key is a legacy parameter that will eventually be removed.
  // It's specific to the default builder and we should phase it out.
  build: function (options, callback) {
    expect.options(options, ['build_directory', 'working_directory', 'contracts_build_directory', 'networks']);

    let builder = options.build;

    // Duplicate build directory for legacy purposes
    options.destination_directory = options.build_directory;

    // No builder specified. Ignore the build then.
    if (typeof builder === 'undefined') {
      if (!options.quiet) {
        return callback(new BuildError("No build configuration specified. Can't build."));
      }
      return callback();
    }

    if (typeof builder === 'string') {
      builder = new CommandBuilder(builder);
    } else if (typeof builder !== 'function') {
      if (!builder.build) {
        return callback(
          new BuildError(
            'Build configuration can no longer be specified as an object. Please see our documentation for an updated list of supported build configurations.'
          )
        );
      }
    } else {
      // If they've only provided a build function, use that.
      builder = {
        build: builder
      };
    }

    // Use our own clean method unless the builder supplies one.
    let clean = this.clean;
    if (builder.hasOwnProperty('clean')) {
      clean = builder.clean;
    }

    clean(options, function (err) {
      if (err) return callback(err);

      // If necessary. This prevents errors due to the .sol.js files not existing.
      Contracts.compile(options, function (err) {
        if (err) return callback(err);

        builder.build(options, function (err) {
          if (!err) return callback();

          if (typeof err === 'string') {
            err = new BuildError(err);
          }

          callback(err);
        });
      });
    });
  }
};

module.exports = Build;
