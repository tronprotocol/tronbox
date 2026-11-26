const { expect } = require('chai');
const fs = require('fs-extra');
const net = require('net');
const path = require('path');
const { makeTmp, removeTmp, runCli, startNode } = require('./helpers');

const MNEMONIC = 'test test test test test test test test test test test junk';

describe('tronbox node', function () {
  this.timeout(30_000);

  let tmp;
  let running;
  beforeEach(() => {
    tmp = makeTmp('tronbox-node-');
  });
  afterEach(async () => {
    if (running) {
      await running.stop();
      running = undefined;
    }
    removeTmp(tmp);
  });

  async function start(args = []) {
    running = await startNode(args, { cwd: tmp });
    return running.url;
  }

  async function request(url, endpoint) {
    const r = await fetch(`${url}/${endpoint}`, { signal: AbortSignal.timeout(5_000) });
    expect(r.status).to.equal(200);
    return r.json();
  }

  it('serves a standalone local chain and exits cleanly on Ctrl+C', async () => {
    fs.writeFileSync(path.join(tmp, 'tronbox.js'), 'throw new Error("Project config must not be loaded");');
    const url = await start();
    expect(url).to.match(/^http:\/\/127\.0\.0\.1:\d+$/);
    const block = await request(url, 'wallet/getnowblock');
    expect(block).to.have.property('blockID');

    const result = await running.stop('SIGINT');
    expect(result.status).to.equal(0);
    running = undefined;
  });

  it('listens on the specified host', async () => {
    const url = await start(['--host', 'localhost']);
    expect(url).to.match(/^http:\/\/localhost:\d+$/);
    const block = await request(url, 'wallet/getnowblock');
    expect(block).to.have.property('blockID');
  });

  it('rejects a blank host', () => {
    const r = runCli(['node', '--host', '   ', '--port', '0'], { cwd: tmp, timeout: 5_000 });
    expect(r.status).to.not.equal(0);
    expect(r.stderr).to.include('Host must not be empty.');
  });

  it('reports a host that cannot be bound', () => {
    const r = runCli(['node', '--host', '192.0.2.1', '--port', '0'], { cwd: tmp, timeout: 5_000 });
    expect(r.status).to.not.equal(0);
    expect(r.stderr).to.include('EADDRNOTAVAIL');
  });

  it('reports a missing --port value without an exception stack', () => {
    const r = runCli(['node', '--port'], { cwd: tmp, timeout: 5_000 });
    expect(r.status).to.not.equal(0);
    expect(r.stderr).to.include('ERROR: The --port option requires a value.');
    expect(r.stderr).to.not.match(/\n\s+at /);
  });

  it('rejects an out-of-range port', () => {
    const r = runCli(['node', '--port', '65536'], { cwd: tmp });
    expect(r.status).to.not.equal(0);
    expect(r.stderr).to.include('Port must be an integer');
  });

  it('reports an occupied port', async () => {
    const occupied = net.createServer();
    await new Promise(resolve => occupied.listen(0, '127.0.0.1', resolve));
    try {
      const r = runCli(['node', '--port', String(occupied.address().port)], { cwd: tmp, timeout: 10_000 });
      expect(r.status).to.not.equal(0);
      expect(r.stderr).to.include('EADDRINUSE');
    } finally {
      await new Promise(resolve => occupied.close(resolve));
    }
  });

  it('loads initial state from a relative JSON file', async () => {
    fs.writeJsonSync(path.join(tmp, 'devnet.json'), {
      mnemonic: { phrase: MNEMONIC, count: 2 }
    });
    const url = await start(['--init', 'devnet.json']);
    const accounts = await request(url, 'admin/accounts-json');
    expect(accounts.privateKeys).to.have.lengthOf(2);
  });

  it('reports invalid initial-state JSON without printing the file contents', () => {
    fs.writeFileSync(path.join(tmp, 'invalid.json'), '{"t":"DEMO","x":X}');
    const invalid = runCli(['node', '--init', 'invalid.json'], { cwd: tmp });
    expect(invalid.status).to.equal(1);
    expect(invalid.stderr).to.include("ERROR: Invalid JSON in initial chain state file 'invalid.json'.");
    expect(invalid.stderr).to.not.include('DEMO');
  });

  it('rejects runtime options in the initial-state file', () => {
    fs.writeJsonSync(path.join(tmp, 'invalid.json'), { runtime: {} });
    const r = runCli(['node', '--init', 'invalid.json'], { cwd: tmp });
    expect(r.status).to.not.equal(0);
    expect(r.stderr).to.include('Initial chain state cannot contain runtime options.');
  });

  it('shows help even when an option value is missing', () => {
    const r = runCli(['node', '--port', '--help'], { cwd: tmp });
    expect(r.status, r.stderr).to.equal(0);
    expect(r.stdout).to.include('Usage: tronbox node');
  });
});
