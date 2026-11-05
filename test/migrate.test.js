// Requires a local TRON development node running on http://127.0.0.1:9090.

const { expect } = require('chai');
const { TronWeb } = require('tronweb');
const path = require('path');
const fs = require('fs-extra');
const { runCli, artifact, FIXTURE_DIR } = require('./helpers');

const cwd = FIXTURE_DIR;
const buildDir = path.join(cwd, 'build');

describe('tronbox migrate', function () {
  this.timeout(60_000);

  describe('default flow', () => {
    it('compiles and runs all migrations on the development network', () => {
      fs.removeSync(buildDir);
      const r = runCli(['migrate'], { cwd });
      expect(r.status, r.stderr).to.equal(0);
      expect(r.stdout).to.include("Using network 'development'");
      expect(r.stdout).to.include('Running migration: 1_initial_migration.js');
      expect(r.stdout).to.include('Running migration: 2_deploy_contracts.js');
      expect(r.stdout).to.include('Deploying Empty');
      expect(fs.existsSync(artifact(buildDir, 'Migrations'))).to.equal(true);
      expect(fs.existsSync(artifact(buildDir, 'Empty'))).to.equal(true);
    });

    it('second run with no changes reports the network is up to date', () => {
      const r = runCli(['migrate'], { cwd });
      expect(r.status, r.stderr).to.equal(0);
      expect(r.stdout).to.include('Network up to date.');
      expect(r.stdout).to.not.include('Running migration:');
    });
  });

  describe('stale recorded address', () => {
    const setRecordedAddress = address => {
      const file = artifact(buildDir, 'Migrations');
      const json = fs.readJsonSync(file);
      json.networks['9'].address = address;
      fs.writeJsonSync(file, json);
    };

    it('redeploys when the recorded contract no longer exists on chain', () => {
      fs.removeSync(buildDir);
      expect(runCli(['migrate'], { cwd }).status).to.equal(0);

      setRecordedAddress(TronWeb.address.toHex(TronWeb.createRandom().address));

      const r = runCli(['migrate'], { cwd });
      expect(r.status, r.stderr).to.equal(0);
      expect(r.stdout).to.include('Running migration: 1_initial_migration.js');
    });

    it('aborts instead of silently re-running when the recorded address is unreadable', () => {
      fs.removeSync(buildDir);
      expect(runCli(['migrate'], { cwd }).status).to.equal(0);

      setRecordedAddress('41dead');

      const r = runCli(['migrate'], { cwd });
      expect(r.status).to.not.equal(0);
      expect(r.stdout).to.not.include('Running migration:');
    });
  });

  describe('renumbered migrations', () => {
    it('runs a pending migration after the last completed one is renumbered', () => {
      fs.removeSync(buildDir);
      expect(runCli(['migrate'], { cwd }).status).to.equal(0);

      const r = runCli(['migrate'], { cwd, env: { MIGRATIONS_DIR: 'migrations_renumbered' } });
      expect(r.status, r.stderr).to.equal(0);
      expect(r.stdout).to.include('Running migration: 3_deploy_contracts.js');
      expect(r.stdout).to.not.include('Network up to date.');
    });
  });

  describe('without Migrations.sol', () => {
    const env = {
      CONTRACTS_DIR: 'contracts_no_migrations',
      MIGRATIONS_DIR: 'migrations_no_migrations',
      BUILD_DIR: 'build_no_migrations'
    };
    const altBuildDir = path.join(cwd, env.BUILD_DIR);

    it('runs migrations and skips recording when Migrations.sol is absent', () => {
      fs.removeSync(altBuildDir);
      const r = runCli(['migrate'], { cwd, env });
      expect(r.status, r.stderr).to.equal(0);
      expect(r.stdout).to.include('Running migration: 1_deploy_contracts.js');
      expect(r.stdout).to.include('Deploying Empty');
      expect(r.stdout).to.not.include('Saving successful migration to network');
      expect(fs.existsSync(artifact(altBuildDir, 'Empty'))).to.equal(true);
      expect(fs.existsSync(artifact(altBuildDir, 'Migrations'))).to.equal(false);
    });

    it('keeps re-running migrations when progress cannot be recorded', () => {
      const r = runCli(['migrate'], { cwd, env });
      expect(r.status, r.stderr).to.equal(0);
      expect(r.stdout).to.include('Running migration: 1_deploy_contracts.js');
      expect(r.stdout).to.not.include('Network up to date.');
    });
  });

  describe('with overwrite: false', () => {
    const env = {
      CONTRACTS_DIR: 'contracts_no_migrations',
      MIGRATIONS_DIR: 'migrations_overwrite',
      BUILD_DIR: 'build_overwrite'
    };
    const altBuildDir = path.join(cwd, env.BUILD_DIR);

    it('first run deploys because no prior address is recorded', () => {
      fs.removeSync(altBuildDir);
      const r = runCli(['migrate'], { cwd, env });
      expect(r.status, r.stderr).to.equal(0);
      expect(r.stdout).to.include('Deploying Empty');
      expect(r.stdout).to.not.include("Didn't deploy Empty");
    });

    it('second run reuses the existing instance and logs "Didn\'t deploy"', () => {
      const r = runCli(['migrate'], { cwd, env });
      expect(r.status, r.stderr).to.equal(0);
      expect(r.stdout).to.include("Didn't deploy Empty");
      expect(r.stdout).to.not.include('Deploying Empty');
    });
  });

  describe('flags', () => {
    it('--reset re-runs every migration', () => {
      const r = runCli(['migrate', '--reset'], { cwd });
      expect(r.status, r.stderr).to.equal(0);
      expect(r.stdout).to.include('Replacing Migrations');
      expect(r.stdout).to.include('Running migration: 2_deploy_contracts.js');
    });

    it('--to limits the run to the chosen migration', () => {
      const r = runCli(['migrate', '--reset', '--to', '1'], { cwd });
      expect(r.status, r.stderr).to.equal(0);
      expect(r.stdout).to.include('Running migration: 1_initial_migration.js');
      expect(r.stdout).to.not.include('Running migration: 2_deploy_contracts.js');
    });

    it('--from picks up at the chosen migration', () => {
      const r = runCli(['migrate', '--from', '2'], { cwd });
      expect(r.status, r.stderr).to.equal(0);
      expect(r.stdout).to.include('Running migration: 2_deploy_contracts.js');
    });

    it('--compile-all forces a recompile', () => {
      const r = runCli(['migrate', '--reset', '--compile-all'], { cwd });
      expect(r.status, r.stderr).to.equal(0);
      expect(r.stdout).to.include('Compiling ./contracts/Empty.sol');
      expect(r.stdout).to.not.include('Everything is up to date');
    });

    it('--quiet suppresses stdout and exits 0', () => {
      const r = runCli(['migrate', '--quiet', '--reset'], { cwd });
      expect(r.status, r.stderr).to.equal(0);
      expect(r.stdout).to.equal('');
    });
  });

  describe('batch deploy', () => {
    const env = {
      CONTRACTS_DIR: 'contracts_advanced',
      MIGRATIONS_DIR: 'migrations_advanced',
      BUILD_DIR: 'build_advanced',
      SOLC_VERSION: '0.8.20'
    };
    const altBuildDir = path.join(cwd, env.BUILD_DIR);

    it('deploys each entry in an array to a distinct address', () => {
      fs.removeSync(altBuildDir);
      const r = runCli(['migrate'], { cwd, env });
      expect(r.status, r.stderr).to.equal(0);
      const addresses = [...r.stdout.matchAll(/Empty:\s+\(base58\) (\S+)/g)].map(m => m[1]);
      expect(addresses).to.have.lengthOf(2);
      expect(addresses[0]).to.not.equal(addresses[1]);
    });
  });

  describe('deploy alias', () => {
    it('behaves like migrate', () => {
      fs.removeSync(buildDir);
      const r = runCli(['deploy'], { cwd });
      expect(r.status, r.stderr).to.equal(0);
      expect(r.stdout).to.include("Using network 'development'");
      expect(r.stdout).to.include('Running migration: 1_initial_migration.js');
      expect(r.stdout).to.include('Running migration: 2_deploy_contracts.js');
      expect(r.stdout).to.include('Deploying Empty');
      expect(fs.existsSync(artifact(buildDir, 'Migrations'))).to.equal(true);
      expect(fs.existsSync(artifact(buildDir, 'Empty'))).to.equal(true);
    });
  });

  describe('throwing migration', () => {
    const env = { MIGRATIONS_DIR: 'migrations_throwing', BUILD_DIR: 'build_throwing' };
    const altBuildDir = path.join(cwd, env.BUILD_DIR);

    it('exits non-zero and surfaces the error', () => {
      fs.removeSync(altBuildDir);
      const r = runCli(['migrate'], { cwd, env });
      expect(r.status).to.not.equal(0);
      expect(r.stdout + r.stderr).to.include('intentional migration failure');
    });
  });

  describe('errors', () => {
    it('--network for an unknown network is rejected', () => {
      const r = runCli(['migrate', '--network', 'nope'], { cwd });
      expect(r.status).to.not.equal(0);
      expect(r.stderr).to.include('does not exist in your "tronbox-config.js"');
    });
  });
});
