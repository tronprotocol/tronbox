const { spawn, spawnSync } = require('child_process');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const TRONBOX_BIN = path.join(REPO_ROOT, 'tronbox.dev');
const FIXTURE_DIR = path.join(__dirname, 'fixture');
const LOCAL_TMP_ROOT = path.join(__dirname, '.temp');

const artifact = (buildDir, name) => path.join(buildDir, 'contracts', `${name}.json`);

// Spawn the dev tronbox CLI. Default timeout exceeds the longest file-level
// mocha timeout (300s) so a single CLI call never silently undercuts a test.
function runCli(args, { cwd = FIXTURE_DIR, env = {}, input, timeout = 300_000, isTTY = false } = {}) {
  const entry = isTTY ? ['-e', 'process.stdout.isTTY = true; require(process.argv[1]);'] : [];
  return spawnSync(process.execPath, [...entry, TRONBOX_BIN, ...args], {
    cwd,
    encoding: 'utf-8',
    timeout,
    input,
    // FORCE_COLOR last so a stray caller can't re-enable ANSI codes and break stdout assertions.
    env: { ...process.env, ...env, FORCE_COLOR: '0' }
  });
}

// Run commands one at a time as the console prompt becomes ready, then exit.
// Pass `bin` and optional `binArgs` to drive an installed tronbox instead of
// the dev CLI.
function runInConsole(commands, { cwd = FIXTURE_DIR, env = {}, timeout = 60_000, bin, binArgs = [] } = {}) {
  return new Promise((resolve, reject) => {
    const spawnEnv = { ...process.env, ...env, FORCE_COLOR: '0' };
    const child = bin
      ? spawn(bin, [...binArgs, 'console'], { cwd, env: spawnEnv, shell: true })
      : spawn(process.execPath, [TRONBOX_BIN, 'console'], { cwd, env: spawnEnv });
    const pending = Array.isArray(commands) ? commands.slice() : [commands];
    let stdout = '';
    let stderr = '';
    let handledPrompts = 0;

    child.stdout.on('data', d => {
      stdout += d.toString();
      const promptCount = (stdout.match(/tronbox\([^)]+\)> /g) || []).length;
      if (promptCount === handledPrompts) return;

      handledPrompts = promptCount;
      if (pending.length) child.stdin.write(`${pending.shift()}\n`);
      else child.stdin.end('.exit\n');
    });
    child.stderr.on('data', d => (stderr += d.toString()));

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`runInConsole timeout after ${timeout}ms\nstdout:\n${stdout}\nstderr:\n${stderr}`));
    }, timeout);

    child.on('close', (status, signal) => {
      clearTimeout(timer);
      resolve({ status, signal, stdout, stderr });
    });
  });
}

// Start the dev node or an installed CLI on an ephemeral loopback port.
async function startNode(args = [], { cwd, bin, binArgs = [], env = {} } = {}) {
  const child = spawn(bin || process.execPath, [...(bin ? binArgs : [TRONBOX_BIN]), 'node', '--port', '0', ...args], {
    cwd,
    env: { ...process.env, ...env, FORCE_COLOR: '0' },
    shell: Boolean(bin),
    detached: Boolean(bin)
  });
  const closed = new Promise(resolve => child.once('close', (status, signal) => resolve({ status, signal })));
  const kill = signal => {
    if (!bin) return child.kill(signal);
    // Stop the wrapper and node together so npx/shell children cannot leak.
    if (child.pid !== undefined) {
      try {
        process.kill(-child.pid, signal);
      } catch (error) {
        if (error.code !== 'ESRCH') throw error;
      }
    }
  };
  const stop = async (signal = 'SIGTERM') => {
    const timer = setTimeout(() => kill('SIGKILL'), 5_000);
    try {
      kill(signal);
      return await closed;
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    const url = await new Promise((resolve, reject) => {
      let output = '';
      let stderr = '';
      let ready = false;
      const timer = setTimeout(() => {
        kill('SIGKILL');
        reject(new Error('Development node startup timed out'));
      }, 10_000);
      child.stdout.on('data', data => {
        if (ready) return;
        output += data.toString();
        const match = output.match(/Started HTTP server at (http:\/\/[^\s]+)/);
        if (match) {
          ready = true;
          clearTimeout(timer);
          resolve(match[1]);
        }
      });
      child.stderr.on('data', data => (stderr += data.toString()));
      child.once('error', error => {
        clearTimeout(timer);
        reject(error);
      });
      closed.then(({ status }) => {
        clearTimeout(timer);
        if (!ready) reject(new Error(`Development node exited with ${status}: ${stderr}`));
      });
    });
    return { url, child, closed, stop };
  } catch (error) {
    await stop();
    throw error;
  }
}

function makeTmp(prefix = 'tronbox-test-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function makeLocalTmp(prefix = 'tronbox-test-') {
  fs.ensureDirSync(LOCAL_TMP_ROOT);
  return fs.mkdtempSync(path.join(LOCAL_TMP_ROOT, prefix));
}

function removeTmp(dir) {
  if (dir && (dir.startsWith(os.tmpdir()) || dir.startsWith(LOCAL_TMP_ROOT))) fs.removeSync(dir);
}

module.exports = {
  runCli,
  runInConsole,
  startNode,
  makeTmp,
  makeLocalTmp,
  removeTmp,
  artifact,
  REPO_ROOT,
  TRONBOX_BIN,
  FIXTURE_DIR
};
