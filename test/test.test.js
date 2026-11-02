// Requires a local TRON development node running on http://127.0.0.1:9090.

const { expect } = require('chai');
const path = require('path');
const fs = require('fs-extra');
const { runCli, FIXTURE_DIR } = require('./helpers');

const cwd = FIXTURE_DIR;
const buildDir = path.join(cwd, 'build');

describe('tronbox test', function () {
  this.timeout(180_000);

  describe('default discovery', () => {
    it('compiles, deploys, and runs every test', () => {
      fs.removeSync(buildDir);
      const r = runCli(['test'], { cwd });
      expect(r.status, r.stderr).to.equal(0);
      expect(r.stdout).to.include("Using network 'development'");
      expect(r.stdout).to.include('Contract: Empty');
      expect(r.stdout).to.include('is deployed and has an address');
    });
  });

  describe('selecting files', () => {
    it('positional file argument runs only that file', () => {
      const r = runCli(['test', 'test/empty.js'], { cwd });
      expect(r.status, r.stderr).to.equal(0);
      expect(r.stdout).to.include('Contract: Empty');
    });

    it('--file selects a single file', () => {
      const r = runCli(['test', '--file', 'test/empty.js'], { cwd });
      expect(r.status, r.stderr).to.equal(0);
      expect(r.stdout).to.include('Contract: Empty');
    });

    it('rejects test files outside the project directory', () => {
      const r = runCli(['test', '/etc/passwd'], { cwd });
      expect(r.status).to.not.equal(0);
      expect(r.stderr).to.match(/outside the project directory/i);
    });
  });

  describe('compile-all', () => {
    before(() => {
      runCli(['compile'], { cwd });

      const r = runCli(['test'], { cwd });
      expect(r.stdout, r.stderr).to.include('Everything is up to date');
    });

    it('forces a recompile even when the build is up to date', () => {
      const r = runCli(['test', '--compile-all'], { cwd });
      expect(r.status, r.stderr).to.equal(0);
      expect(r.stdout).to.include('Compiling ./contracts/Empty.sol');
      expect(r.stdout).to.not.include('Everything is up to date');
    });
  });

  describe('scenarios', () => {
    describe('contracts_advanced', () => {
      const env = {
        CONTRACTS_DIR: 'contracts_advanced',
        MIGRATIONS_DIR: 'migrations_advanced',
        TEST_DIR: 'test_advanced',
        BUILD_DIR: 'build_advanced',
        SOLC_VERSION: '0.8.20'
      };
      const altBuildDir = path.join(cwd, env.BUILD_DIR);

      it('compiles, deploys, and runs every test', () => {
        fs.removeSync(altBuildDir);
        const r = runCli(['test'], { cwd, env });
        expect(r.status, r.stderr).to.equal(0);
        expect(r.stdout).to.include('Contract: Roster');
      });
    });

    describe('contracts_tre', () => {
      const env = {
        CONTRACTS_DIR: 'contracts_tre',
        MIGRATIONS_DIR: 'migrations_tre',
        TEST_DIR: 'test_tre',
        BUILD_DIR: 'build_tre'
      };
      const altBuildDir = path.join(cwd, env.BUILD_DIR);

      it('compiles, deploys, and runs every test', () => {
        fs.removeSync(altBuildDir);
        const r = runCli(['test'], { cwd, env });
        expect(r.status, r.stderr).to.equal(0);
        expect(r.stdout).to.include('Contract: Sandbox');
      });
    });

    describe('contracts_console', () => {
      const env = {
        CONTRACTS_DIR: 'contracts_console',
        MIGRATIONS_DIR: 'migrations_console',
        BUILD_DIR: 'build_console',
        SOLC_VERSION: '0.8.20'
      };
      const altBuildDir = path.join(cwd, env.BUILD_DIR);
      const actualLog = path.join(cwd, 'test_console', 'actual.log');
      const expectedSnap = path.join(cwd, 'test_console', 'expected.snap');

      it('console.log output matches the snapshot', () => {
        fs.removeSync(altBuildDir);
        fs.removeSync(actualLog);

        const r = runCli(['migrate', '--reset', '--quiet'], {
          cwd,
          env: { ...env, TRONBOX_SOLIDITY_CONSOLE_LOG: 'true' }
        });
        expect(r.status, r.stderr).to.equal(0);
        expect(r.stdout, 'console.log output unexpectedly empty').to.not.equal('');
        fs.writeFileSync(actualLog, r.stdout);
        expect(fs.readFileSync(actualLog, 'utf-8')).to.equal(fs.readFileSync(expectedSnap, 'utf-8'));
        fs.removeSync(actualLog);
      });
    });

    describe('contracts_evm', () => {
      const env = {
        CONTRACTS_DIR: 'contracts_evm',
        MIGRATIONS_DIR: 'migrations_evm',
        TEST_DIR: 'test_evm',
        BUILD_DIR: 'build_evm'
      };
      const altBuildDir = path.join(cwd, env.BUILD_DIR);

      it('compiles, deploys, and runs every test', () => {
        fs.removeSync(altBuildDir);
        const r = runCli(['test', '--evm'], { cwd, env });
        expect(r.status, r.stderr).to.equal(0);
        expect(r.stdout).to.include('Contract: MetaCoin');
        expect(r.stdout).to.include('Contract: MyContract');
      });
    });

    describe('test_require', () => {
      const env = { TEST_DIR: 'test_require' };

      it('exercises Resolver.require dispatch paths', () => {
        const r = runCli(['test'], { cwd, env });
        expect(r.status, r.stderr).to.equal(0);
        expect(r.stdout).to.include('Contract: artifacts.require');
      });
    });

    describe('test_deployment', () => {
      const env = { TEST_DIR: 'test_deployment' };

      it('rejects a deployment response for a different contract address', () => {
        const r = runCli(['test'], { cwd, env });
        expect(r.status, r.stderr).to.equal(0);
        expect(r.stdout).to.include('Contract: Deployment address');
        expect(r.stdout).to.include('1 passing');
      });
    });

    describe('test_failing', () => {
      const env = { TEST_DIR: 'test_failing' };

      [1, 2, 127, 130, 256, 512].forEach(failures => {
        it(`exits with 1 and reports ${failures} failing tests`, () => {
          const r = runCli(['test'], { cwd, env: { ...env, TEST_FAILURE_COUNT: String(failures) } });
          expect(r.status, r.stderr).to.equal(1);
          expect(r.stdout).to.include(`${failures} failing`);
          expect(r.stdout).to.include('intentional assertion failure');
        });
      });
    });
  });

  describe('errors', () => {
    it('--network for an unknown network is rejected', () => {
      const r = runCli(['test', '--network', 'nope'], { cwd });
      expect(r.status).to.not.equal(0);
      expect(r.stderr).to.include('does not exist in your "tronbox-config.js"');
    });
  });
});
