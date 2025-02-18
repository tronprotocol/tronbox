const path = require('path');
const spawn = require('child_process').spawn;

const cli_path = path.resolve(path.join(__dirname, './index.js'));

const args = [cli_path, 'exec'];

Array.prototype.push.apply(args, process.argv.slice(2));

const cmd = spawn('node', args);

cmd.stdout.on('data', data => {
  console.info(data.toString());
});

cmd.stderr.on('data', data => {
  console.error(data.toString());
});

cmd.on('close', code => {
  process.exit(code);
});

cmd.on('error', function (err) {
  throw err;
});
