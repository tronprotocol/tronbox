/*
 * returns a VCS url string given:
 * - a VCS url string
 * - a github `org/repo` string
 * - a string containing a repo under the `truffle-box` org
 */
function normalizeURL(url) {
  url = url || 'https://github.com/tronsuper/bare-box';

  // full URL already
  if (url.indexOf('://') !== -1 || url.indexOf('git@') !== -1) {
    return url;
  }

  if (url.split('/').length === 2) {
    // `org/repo`
    return 'https://github.com/' + url;
  }

  if (url.indexOf('/') === -1) {
    // repo name only
    if (url.indexOf('-box') === -1) {
      url = url + '-box';
    }
    return 'https://github.com/tronsuper/' + url;
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

const command = {
  command: 'unbox',
  description: 'Download a tronbox Box, a pre-built tronbox project',
  builder: {},
  run: function (options, done) {
    const Config = require('../../components/Config');
    const Box = require('../../components/Box');
    const OS = require('os');

    const config = Config.default().with({
      logger: console
    });

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
          config.logger.log(boxConfig.epilogue.replace('\n', OS.EOL));
        }

        done();
      })
      .catch(done);
  }
};

module.exports = command;
