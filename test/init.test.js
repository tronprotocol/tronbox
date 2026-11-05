// `tronbox init` writes a sample project into the current working directory.
// Each test runs inside an isolated temp directory.
// The MetaCoin integration tests require local TRON and EVM development nodes
// at the endpoints configured in the generated project.

const { expect } = require('chai');
const path = require('path');
const fs = require('fs-extra');
const { runCli, makeTmp, removeTmp } = require('./helpers');

describe('tronbox init', function () {
  this.timeout(300_000);

  describe('default JavaScript project', () => {
    let tmp;
    before(() => {
      tmp = makeTmp();
      const r = runCli(['init'], {
        cwd: tmp,
        env: { TRONBOX_CREATE_JAVASCRIPT_PROJECT_WITH_DEFAULTS: 'true' }
      });
      expect(r.status, r.stderr).to.equal(0);
    });
    after(() => removeTmp(tmp));

    it('lays down the expected project skeleton', () => {
      ['tronbox-config.js', 'tronbox-evm-config.js', 'README.md'].forEach(f => {
        expect(fs.existsSync(path.join(tmp, f)), f).to.equal(true);
      });
      ['contracts', 'migrations', 'test'].forEach(d => {
        expect(fs.statSync(path.join(tmp, d)).isDirectory(), d).to.equal(true);
      });
      // The packaged `gitignore` template is renamed to `.gitignore` on init.
      expect(fs.existsSync(path.join(tmp, '.gitignore'))).to.equal(true);
    });

    it('the generated project compiles successfully', () => {
      const r = runCli(['compile'], { cwd: tmp });
      expect(r.status, r.stderr).to.equal(0);
      expect(r.stdout).to.include('Compiling ./contracts/Migrations.sol');
      expect(r.stdout).to.include('Compiled successfully');
    });
  });

  describe('MetaCoin JavaScript project', () => {
    let tmp;
    before(() => {
      tmp = makeTmp();
      const r = runCli(['init'], {
        cwd: tmp,
        env: { TRONBOX_CREATE_JAVASCRIPT_METACOIN_PROJECT_WITH_DEFAULTS: 'true' }
      });
      expect(r.status, r.stderr).to.equal(0);
    });
    after(() => removeTmp(tmp));

    it('lays down the expected MetaCoin project skeleton', () => {
      ['tronbox-config.js', 'tronbox-evm-config.js', 'README.md', 'package.json'].forEach(f => {
        expect(fs.existsSync(path.join(tmp, f)), f).to.equal(true);
      });
      ['contracts/ConvertLib.sol', 'contracts/MetaCoin.sol', 'contracts/Migrations.sol'].forEach(f => {
        expect(fs.existsSync(path.join(tmp, f)), f).to.equal(true);
      });
      expect(fs.existsSync(path.join(tmp, '.gitignore'))).to.equal(true);
      // `npm install` runs as part of init when package.json is present.
      expect(fs.statSync(path.join(tmp, 'node_modules')).isDirectory()).to.equal(true);
    });

    it('runs `tronbox test` successfully against the development network', () => {
      const r = runCli(['test'], { cwd: tmp });
      expect(r.status, r.stderr).to.equal(0);
      expect(r.stdout).to.include("Using network 'development'");
      expect(r.stdout).to.include('Contract: MetaCoin');
      expect(r.stdout).to.match(/6 passing/);
      expect(r.stdout).to.not.match(/\d+ pending/);
      expect(r.stdout).to.not.match(/\d+ failing/);
    });

    it('runs the shared tests in EVM mode and skips only the TRON-specific cases', () => {
      const r = runCli(['test', '--evm'], { cwd: tmp });
      expect(r.status, r.stderr).to.equal(0);
      expect(r.stdout).to.include('Contract: MetaCoin');
      expect(r.stdout).to.match(/4 passing/);
      expect(r.stdout).to.match(/2 pending/);
      expect(r.stdout).to.not.match(/\d+ failing/);
    });
  });

  describe('errors', () => {
    it('refuses to write into a non-empty directory', () => {
      const tmp = makeTmp();
      try {
        fs.writeFileSync(path.join(tmp, 'preexisting.txt'), 'x');
        const r = runCli(['init'], {
          cwd: tmp,
          env: { TRONBOX_CREATE_JAVASCRIPT_PROJECT_WITH_DEFAULTS: 'true' }
        });
        expect(r.status).to.not.equal(0);
        expect(r.stdout + r.stderr).to.match(/directory is not empty/i);
        expect(fs.existsSync(path.join(tmp, 'tronbox-config.js'))).to.equal(false);
      } finally {
        removeTmp(tmp);
      }
    });

    it('rejects a positional template argument', () => {
      const tmp = makeTmp();
      try {
        const r = runCli(['init', 'metacoin'], { cwd: tmp });
        expect(r.status).to.not.equal(0);
        expect(r.stdout + r.stderr).to.include('no longer accepts a project template name as an argument');
      } finally {
        removeTmp(tmp);
      }
    });
  });
});
