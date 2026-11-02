const ReplManager = require('./repl');
const Command = require('./command');
const provision = require('../components/Provisioner');
const contract = require('../components/Contract');
const TronWrap = require('../components/TronWrap');
const { expect } = require('./utils');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const EventEmitter = require('events');
const { inherits } = require('util');
const chalk = require('chalk');

const { logErrorAndExit } = TronWrap;

inherits(Console, EventEmitter);

function Console(tasks, options) {
  EventEmitter.call(this);

  const self = this;

  expect.options(options, [
    'working_directory',
    'contracts_directory',
    'contracts_build_directory',
    'migrations_directory',
    'network',
    'network_id',
    'resolver',
    'build_directory'
  ]);

  this.options = options;

  this.repl = options.repl || new ReplManager(options);
  this.command = new Command(tasks);

  // if "development" exists, default to using that
  if (!options.network && options.networks.development) {
    options.network = 'development';
  }

  try {
    this.tronWrap = TronWrap();
  } catch (err) {
    logErrorAndExit(console, err.message);
  }

  // Bubble the ReplManager's exit event
  this.repl.on('exit', function () {
    self.emit('exit');
  });
}

Console.prototype.start = function (callback) {
  const self = this;

  if (!this.repl) {
    this.repl = new ReplManager(this.options);
  }

  // TODO: This should probably be elsewhere.
  // It's here to ensure the repl manager instance gets
  // passed down to commands.
  this.options.repl = this.repl;

  this.provision(function (err, abstractions) {
    if (err) return callback(err);

    self.repl.start({
      prompt: 'tronbox(' + self.options.network + ')> ',
      context: {
        tronWrap: self.tronWrap,
        tronWeb: self.tronWrap,
        ethers: self.tronWrap._ethers ? self.tronWrap._ethers : undefined
      },
      interpreter: self.interpret.bind(self),
      done: callback
    });

    self.resetContractsInConsoleContext(abstractions);
  });
};

Console.prototype.provision = function (callback) {
  const self = this;

  fs.readdir(this.options.contracts_build_directory, function (err, files) {
    if (err) {
      // Error reading the build directory? Must mean it doesn't exist or we don't have access to it.
      // Couldn't provision the contracts if we wanted. It's possible we're hiding very rare FS
      // errors, but that's better than showing the user error messages that will be "build folder
      // doesn't exist" 99.9% of the time.
    }

    const promises = [];
    files = (files || []).filter(file => path.extname(file) === '.json');

    files.forEach(function (file) {
      promises.push(
        new Promise(function (accept, reject) {
          fs.readFile(path.join(self.options.contracts_build_directory, file), 'utf8', function (err, body) {
            if (err) return reject(err);
            try {
              body = JSON.parse(body);
            } catch (e) {
              return reject(new Error('Cannot parse ' + file + ': ' + e.message));
            }

            accept(body);
          });
        })
      );
    });

    Promise.all(promises)
      .then(function (json_blobs) {
        const abstractions = json_blobs.map(function (json) {
          const abstraction = contract(json);
          provision(abstraction, self.options);
          return abstraction;
        });

        self.resetContractsInConsoleContext(abstractions);

        callback(null, abstractions);
      })
      .catch(callback);
  });
};

Console.prototype.resetContractsInConsoleContext = function (abstractions) {
  const self = this;

  abstractions = abstractions || [];

  const contextVars = {};

  abstractions.forEach(function (abstraction) {
    if (abstraction.contract_name === 'console') return;
    contextVars[abstraction.contract_name] = abstraction;
  });

  self.repl.setContextVars(contextVars);
};

Console.prototype.interpret = function (cmd, context, filename, evaluate, callback) {
  const self = this;

  cmd = cmd.trim();
  if (cmd === '') {
    return callback();
  }

  const cmdRes = this.command.getCommand(cmd);
  if (cmdRes != null) {
    if (cmdRes.name === 'help') {
      return self.command.run(cmd, this.options, callback);
    }
    if (cmdRes.argv.help) {
      this.command.args.parse(cmd);
      return callback();
    }

    const excludeKeys = ['_', '$0', 'f', 'evm', 'network'];
    const args = [...cmdRes.argv._];
    Object.keys(cmdRes.argv)
      .filter(key => !excludeKeys.includes(key) && !/[A-Z]/.test(key))
      .forEach(key => {
        const value = cmdRes.argv[key];
        args.push(`--${key}`);
        if (value !== true) args.push(`${value}`);
      });
    args.push('--network');
    args.push(`${this.options.network}`);
    if (this.options.evm) args.push('--evm');

    let errMsg = '';
    if (cmdRes.argv.evm && !this.options.evm) {
      errMsg = `The command was run with --evm, but the current REPL is not in EVM mode. Please restart the console with --evm if needed.`;
    }
    if (cmdRes.argv.network && cmdRes.argv.network !== this.options.network) {
      errMsg = `The command was run with --network=${cmdRes.argv.network}, but the current REPL is using --network=${this.options.network}. Please restart the console with the correct network if needed.`;
    }

    if (errMsg) {
      console.error(chalk.red(chalk.bold('ERROR:'), errMsg));
      return callback();
    }

    try {
      const spawnedProcess = spawn(process.execPath, [process.argv[1], ...args], {
        env: { ...process.env, FORCE_COLOR: '1' },
        encoding: 'utf8'
      });

      let bufferedError = '';
      spawnedProcess.stderr.on('data', data => {
        bufferedError += data.toString();
      });

      spawnedProcess.stdout.on('data', data => {
        process.stdout.write(data.toString());
      });

      spawnedProcess.on('close', code => {
        if (bufferedError) {
          console.error(bufferedError);
        }

        if (!code) {
          // Reprovision after each command as it may change contracts.
          self.provision(function (err) {
            // Don't pass abstractions to the callback if they're there or else
            // they'll get printed in the repl.
            callback(err);
          });
          return;
        }
        callback();
      });
    } catch (error) {
      console.error(chalk.red(chalk.bold('ERROR:'), error && error.message ? error.message : error));
      callback();
    }

    return;
  }

  let evaluating = true;
  evaluate(cmd, context, filename, function (err, result) {
    // Native await calls back asynchronously; finish before buffered input resumes.
    if (err || !evaluating) return callback(err, result);

    // Resolve all promises. This will leave non-promises alone.
    Promise.resolve(result)
      .then(function (res) {
        callback(null, res);
      })
      .catch(function (err) {
        let msg = typeof err === 'string' ? err : err && err.message ? err.message : String(err);
        msg = msg.replace(/^error(:|) /i, '');
        console.error(chalk.red(chalk.bold('ERROR:'), msg));
        callback();
      });
  });
  evaluating = false;
};

module.exports = Console;
