const fs = require('fs-extra');
const chalk = require('chalk');
const TronBoxError = require('../../lib/errors/tronBoxError');

async function run(options) {
  for (const key of ['host', 'port', 'init']) {
    if (Object.prototype.hasOwnProperty.call(options, key) && (options[key] === undefined || options[key] === '')) {
      throw new TronBoxError(`The --${key} option requires a value.`);
    }
  }
  const { host = '127.0.0.1', port = 9090 } = options;
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new TronBoxError('Port must be an integer between 0 and 65535.');
  }
  if (!host.trim()) {
    throw new TronBoxError('Host must not be empty.');
  }
  if (options._ && options._.length) {
    throw new TronBoxError('The `node` command does not accept positional arguments.');
  }

  let initial = {};
  if (options.init !== undefined) {
    try {
      initial = await fs.readJson(options.init);
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
      // JSON parse errors can include text from the initial-state file.
      throw new TronBoxError(`Invalid JSON in initial chain state file '${options.init}'.`);
    }
    if (!initial || typeof initial !== 'object' || Array.isArray(initial)) {
      throw new TronBoxError('Initial chain state must be a JSON object.');
    }
    if (Object.prototype.hasOwnProperty.call(initial, 'runtime')) {
      throw new TronBoxError('Initial chain state cannot contain runtime options.');
    }
  }

  const { TronNode, TronProvider, startHttpServer } = require('@tvmjs/client');
  const logger = options.logger;
  let ready = false;
  const runtimeLogger = {
    log: message => {
      if (ready) logger.log(message);
    }
  };
  const node = await TronNode.create({ ...initial, runtime: { logger: runtimeLogger } });
  const provider = new TronProvider(node);
  const accounts = await provider.request({ method: 'admin/accounts' });
  const { server, url } = await startHttpServer(provider, { host, port });

  let stopping = false;
  const stop = () => {
    if (stopping) return;
    stopping = true;
    server.close();
    server.closeAllConnections();
  };

  try {
    // Keep the command alive until shutdown; calling done at startup would exit the CLI.
    await new Promise((resolve, reject) => {
      server.once('close', resolve);
      server.once('error', reject);
      process.on('SIGINT', stop);
      process.on('SIGTERM', stop);

      logger.log(chalk.green(`Started HTTP server at ${url}`));
      logger.log();
      logger.log(accounts.trimEnd());
      logger.log();
      ready = true;
    });
  } finally {
    process.removeListener('SIGINT', stop);
    process.removeListener('SIGTERM', stop);
    stop();
  }
}

module.exports = { run };
