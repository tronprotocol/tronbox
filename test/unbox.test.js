// Hits GitHub to clone the box. The metacoin-box round-trip also needs a local TRON development node
// running on http://127.0.0.1:9090.

const { expect } = require('chai');
const path = require('path');
const fs = require('fs-extra');
const { runCli, makeLocalTmp, removeTmp } = require('./helpers');

describe('tronbox unbox', function () {
  this.timeout(300_000);

  describe('default box', () => {
    let tmp;
    before(() => {
      tmp = makeLocalTmp();
      const r = runCli(['unbox'], { cwd: tmp });
      expect(r.status, r.stderr).to.equal(0);
      expect(r.stdout).to.include('Unbox successful');
    });
    after(() => removeTmp(tmp));

    it('lays down the expected project skeleton', () => {
      ['tronbox-config.js', 'tronbox.js'].forEach(f => {
        expect(fs.existsSync(path.join(tmp, f)), f).to.equal(true);
      });
      ['contracts', 'migrations', 'test'].forEach(d => {
        expect(fs.statSync(path.join(tmp, d)).isDirectory(), d).to.equal(true);
      });
    });

    it('the unboxed project compiles successfully', () => {
      const r = runCli(['compile'], { cwd: tmp });
      expect(r.status, r.stderr).to.equal(0);
      expect(r.stdout).to.include('Compiled successfully');
    });
  });

  describe('metacoin-box', () => {
    let tmp;
    let cliTmpDir;
    let env;
    before(() => {
      tmp = makeLocalTmp();
      cliTmpDir = makeLocalTmp();
      env = { TMPDIR: cliTmpDir, TMP: cliTmpDir, TEMP: cliTmpDir };
      const r = runCli(['unbox', 'metacoin-box'], { cwd: tmp, env });
      expect(r.status, r.stderr).to.equal(0);
      expect(r.stdout).to.include('Unbox successful');
    });
    after(() => {
      const leaked = cliTmpDir ? fs.readdirSync(cliTmpDir).filter(n => n.startsWith('tronbox-')) : [];
      expect(leaked, 'leaked temp dirs').to.deep.equal([]);
      removeTmp(tmp);
      removeTmp(cliTmpDir);
    });

    it('installs npm dependencies and writes contracts/MetaCoin.sol', () => {
      expect(fs.existsSync(path.join(tmp, 'package.json'))).to.equal(true);
      expect(fs.statSync(path.join(tmp, 'node_modules')).isDirectory()).to.equal(true);
      expect(fs.existsSync(path.join(tmp, 'contracts', 'MetaCoin.sol'))).to.equal(true);
    });

    it('runs `tronbox test` successfully against the development network', () => {
      const r = runCli(['test'], { cwd: tmp, env });
      expect(r.status, r.stderr).to.equal(0);
      expect(r.stdout).to.include("Using network 'development'");
      expect(r.stdout).to.include('Contract: MetaCoin');
      expect(r.stdout).to.match(/\d+ passing/);
      expect(r.stdout).to.not.match(/\d+ failing/);
    });
  });

  describe('quiet', () => {
    it('suppresses stdout but still lays down the project', () => {
      const tmp = makeLocalTmp();
      try {
        const r = runCli(['unbox', '--quiet'], { cwd: tmp });
        expect(r.status, r.stderr).to.equal(0);
        expect(r.stdout).to.equal('');
        expect(fs.existsSync(path.join(tmp, 'tronbox.js'))).to.equal(true);
      } finally {
        removeTmp(tmp);
      }
    });
  });

  describe('errors', () => {
    it('rejects a malformed box specifier', () => {
      const tmp = makeLocalTmp();
      try {
        // Three slashes, not a URL or `org/repo`, not a bare name — the normalizer rejects it.
        const r = runCli(['unbox', 'a/b/c'], { cwd: tmp });
        expect(r.status).to.not.equal(0);
        expect(r.stderr).to.match(/invalid format/i);
      } finally {
        removeTmp(tmp);
      }
    });
  });
});
