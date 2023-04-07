const command = {
  command: 'watch',
  description: 'Watch filesystem for changes and rebuild the project automatically',
  builder: {},
  run: function (options) {
    process.env.CURRENT = 'watch';
    const Build = require('../build');
    const Config = require('../../components/Config');
    const chokidar = require('chokidar');
    const path = require('path');
    const colors = require('colors');
    const Contracts = require('../../components/WorkflowCompile');
    const TruffleError = require('@truffle/error');

    const config = Config.detect(options);

    const printSuccess = function () {
      config.logger.log(colors.green('Completed without errors on ' + new Date().toString()));
    };

    const printFailure = function (err) {
      if (err instanceof TruffleError) {
        console.error(err.message);
      } else {
        // Bubble up all other unexpected errors.
        console.error(err.stack || err.toString());
      }
    };

    let working = false;
    let needs_rebuild = true;
    let needs_recompile = true;

    const watchPaths = [
      path.join(config.working_directory, 'app/**/*'),
      path.join(config.contracts_build_directory, '/**/*'),
      path.join(config.contracts_directory, '/**/*'),
      path.join(config.working_directory, 'tronbox-config.js'),
      path.join(config.working_directory, 'tronbox.js')
    ];

    chokidar
      .watch(watchPaths, {
        ignored: /[/\\]\./, // Ignore files prefixed with "."
        cwd: config.working_directory,
        ignoreInitial: true
      })
      .on('all', function (event, filePath) {
        // On changed/added/deleted
        const display_path = path.join('./', filePath.replace(config.working_directory, ''));
        config.logger.log(colors.cyan('>> File ' + display_path + ' changed.'));

        needs_rebuild = true;

        if (path.join(config.working_directory, filePath).indexOf(config.contracts_directory) >= 0) {
          needs_recompile = true;
        }
      });

    const check_rebuild = function () {
      if (working) {
        setTimeout(check_rebuild, 200);
        return;
      }

      if (needs_rebuild) {
        needs_rebuild = false;

        if (config.build != null) {
          config.logger.log('Rebuilding...');
          working = true;

          Build.build(config, function (err) {
            if (err) {
              printFailure(err);
            } else {
              printSuccess();
            }
            working = false;
          });
        }
      } else if (needs_recompile) {
        needs_recompile = false;
        working = true;

        Contracts.compile(config, function (err) {
          if (err) {
            printFailure(err);
          }
          working = false;
        });
      }

      setTimeout(check_rebuild, 200);
    };

    check_rebuild();
  }
};

module.exports = command;
