/*
 * returns a VCS url string given:
 * - a VCS url string
 * - a github `org/repo` string
 * - a string containing a repo under the `tronsuper` org
 */
function normalizeURL(url) {
  url = url || 'https://github.com/tronsuper/bare-box';

  // full URL already
  if (url.indexOf('https://') !== -1 || url.indexOf('git@') !== -1) {
    return url;
  }

  if (url.split('/').length === 2) {
    // `org/repo`
    return 'https://github.com/' + url;
  }

  if (url.indexOf('/') === -1) {
    // repo name only, optionally with a #ref
    const [name, ref] = url.split('#');
    const repo = name.indexOf('-box') === -1 ? name + '-box' : name;
    return 'https://github.com/tronsuper/' + repo + (ref ? '#' + ref : '');
  }

  throw new Error('Box specified in invalid format');
}

/*
 * returns a list of messages, one for each command, formatted
 * so that:
 *
 *    command key:   command string
 *
 * are aligned
 */
function formatCommands(commands) {
  const names = Object.keys(commands);

  const maxLength = Math.max.apply(
    null,
    names.map(function (name) {
      return name.length;
    })
  );

  return names.map(function (name) {
    const spacing = Array(maxLength - name.length + 1).join(' ');
    return '  ' + name + ': ' + spacing + commands[name];
  });
}

const pkg = require('../pkg');
const describe = 'Download a pre-built TronBox Box template (deprecated)';
const deprecationNotice = 'DEPRECATED: The `unbox` command will be removed in a future version.';

const command = {
  command: 'unbox',
  describe,
  builder: yargs => {
    yargs
      .usage(
        `TronBox v${pkg.version}\n\n${describe}\n\n${deprecationNotice}\n
Usage: $0 unbox [<name>] [--quiet]`
      )
      .version(false)
      .options({
        quiet: {
          describe: 'Suppress all output except errors',
          type: 'boolean'
        }
      })
      .positional('name', {
        describe: 'Box name, user/repo, or GitHub URL, optionally with #ref. Omit for the default box.',
        type: 'string'
      })
      .example('$0 unbox', 'Download the default TronBox Box')
      .example('$0 unbox metacoin', 'Download a TronBox Box by name')
      .example('$0 unbox user/my-box#v1.0', 'Download a TronBox Box by GitHub username/repo with #ref')
      .example('$0 unbox https://github.com/user/my-box', 'Download a TronBox Box from a full GitHub URL')
      .group(['quiet', 'help'], 'Options:');
  },
  run: function (options, done) {
    const Config = require('../../components/Config');
    const Box = require('../../components/Box');
    const OS = require('os');
    const chalk = require('chalk');

    const config = Config.default().with({
      logger: console
    });

    if (options.quiet || options.silent) {
      config.logger = {
        log: function () {}
      };
    }

    const url = normalizeURL(options._[0]);
    Box.unbox(url, options.working_directory || config.working_directory, {
      logger: config.logger
    })
      .then(function (boxConfig) {
        config.logger.log('Unbox successful. Sweet!' + OS.EOL);

        const commandMessages = formatCommands(boxConfig.commands);
        if (commandMessages.length > 0) {
          config.logger.log('Commands:' + OS.EOL);
        }
        commandMessages.forEach(function (message) {
          config.logger.log(message);
        });

        if (boxConfig.epilogue) {
          config.logger.log(boxConfig.epilogue.replace(/\n/g, OS.EOL));
        }

        done();
      })
      .catch(err => {
        if (err) {
          console.error(chalk.red(chalk.bold('ERROR:'), err.message ? err.message : err));
          process.exit(1);
        }
        done();
      });
  }
};

module.exports = command;
