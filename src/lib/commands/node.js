const pkg = require('../pkg');
const describe = 'Start a local TRON development node';

module.exports = {
  command: 'node',
  describe,
  builder: yargs => {
    yargs
      .usage(`TronBox v${pkg.version}\n\n${describe}\n\nUsage: $0 node [--host <host>] [--port <port>] [--init <file>]`)
      .version(false)
      .options({
        host: {
          describe: 'Address to bind; defaults to 127.0.0.1',
          type: 'string'
        },
        port: {
          describe: 'HTTP port to listen on; defaults to 9090',
          type: 'number'
        },
        init: {
          describe: 'JSON file containing the initial chain state',
          type: 'string'
        }
      })
      .example('$0 node', 'Start a local development node')
      .example('$0 node --host "*"', 'Listen on all interfaces')
      .example('$0 node --port 9091', 'Listen on port 9091')
      .example('$0 node --init ./devnet.json', 'Load a custom initial state')
      .group(['host', 'port', 'init', 'help'], 'Options:');
  },
  run: function (options, done) {
    process.env.CURRENT = 'node';
    const Node = require('../../components/Node');
    Node.run(options).then(() => done(), done);
  }
};
