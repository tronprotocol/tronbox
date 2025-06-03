const pc = require('picocolors');

function sleep(millis) {
  return new Promise(resolve => setTimeout(resolve, millis));
}

function log(_) {
  process.stdout.write(pc.yellow(_));
}

module.exports = async function (secs) {
  secs = secs || 1;
  log(`Sleeping for ${secs} second${secs === 1 ? '' : 's'}...`);
  await sleep(1000 * (secs || 1));
  log(' Slept.\n');
};
