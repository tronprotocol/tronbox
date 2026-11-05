const fs = require('fs-extra');
const path = require('path');
const { spawnSync } = require('child_process');
const { expect } = require('chai');
const { REPO_ROOT, makeTmp, makeLocalTmp, removeTmp, runInConsole } = require('./helpers');

const ALWAYS_SKIP = new Set(['.git', 'node_modules', '.DS_Store']);

// Cap for every spawned command; kills a hung child with its output captured,
// well before the file-level mocha timeout reports.
const COMMAND_TIMEOUT = 300_000;

function walk(dir, prefix = '') {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ALWAYS_SKIP.has(entry.name)) continue;
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...walk(path.join(dir, entry.name), rel));
    else out.push(rel);
  }
  return out;
}

describe('npm pack', function () {
  this.timeout(600_000);

  let tmpPack;
  let tarball;
  let packed;

  before(function () {
    tmpPack = makeTmp('tronbox-pack-tarball-');
    const r = spawnSync('npm', ['pack', '--pack-destination', tmpPack, '--json'], {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
      timeout: COMMAND_TIMEOUT,
      shell: true
    });
    if (r.status !== 0) throw new Error(`npm pack failed: ${r.stderr}`);
    const jsonStart = r.stdout.indexOf('[');
    if (jsonStart < 0) throw new Error(`npm pack produced no JSON:\n${r.stdout}`);
    const meta = JSON.parse(r.stdout.slice(jsonStart))[0];
    tarball = path.join(tmpPack, meta.filename);
    packed = new Set(meta.files.map(f => f.path));
  });

  after(() => removeTmp(tmpPack));

  describe('tarball contents', () => {
    it('ships every required directory and root file', () => {
      const requiredRoots = ['build', 'sample-projects'];
      const missingFromRequiredRoots = [];

      for (const root of requiredRoots) {
        for (const f of walk(path.join(REPO_ROOT, root), root)) {
          if (!packed.has(f)) missingFromRequiredRoots.push(f);
        }
      }

      expect(
        missingFromRequiredRoots,
        `npm pack is missing files under required directories:\n${missingFromRequiredRoots.join('\n')}`
      ).to.be.empty;

      const requiredRootFiles = ['console.sol', 'README.md', 'LICENSE'];
      const missingRootFiles = requiredRootFiles.filter(f => !packed.has(f));
      expect(missingRootFiles, `npm pack is missing required root files:\n${missingRootFiles.join('\n')}`).to.be.empty;
    });

    it('keeps build/ aligned with src/', () => {
      const srcFiles = new Set(walk(path.join(REPO_ROOT, 'src')));
      const buildFiles = new Set(walk(path.join(REPO_ROOT, 'build')));
      const allowedExtras = new Set(['tronbox.js']);

      const missing = [...srcFiles].filter(f => !buildFiles.has(f));
      const extra = [...buildFiles].filter(f => !srcFiles.has(f) && !allowedExtras.has(f));

      const lines = [];
      if (missing.length)
        lines.push(`files present in src/ but missing in build/:\n${missing.map(f => `  - ${f}`).join('\n')}`);
      if (extra.length)
        lines.push(`unexpected files in build/ without a src/ counterpart:\n${extra.map(f => `  + ${f}`).join('\n')}`);

      expect(lines.length, `build/ and src/ are out of sync:\n${lines.join('\n')}`).to.equal(0);
    });
  });

  function installedPackageChecks(name, install) {
    describe(name, function () {
      let root;
      let cli;

      before(function () {
        // Keep the install root outside os.tmpdir so executable paths use the
        // same spelling on macOS instead of mixing /var and /private/var.
        root = makeLocalTmp('tronbox-pack-install-');
        cli = { root, ...install.call(this, root) };
      });

      after(() => removeTmp(root));

      function run(args, { cwd, env = {} } = {}) {
        return spawnSync(cli.bin, [...cli.binArgs, ...args], {
          cwd,
          encoding: 'utf-8',
          timeout: COMMAND_TIMEOUT,
          shell: true,
          env: { ...process.env, ...cli.env, ...env, FORCE_COLOR: '0' }
        });
      }

      function expectTestsToPass(r) {
        expect(r.status, r.stderr).to.equal(0);
        expect(r.stdout).to.include("Using network 'development'");
        expect(r.stdout).to.include('Contract: MetaCoin');
        expect(r.stdout).to.match(/\d+ passing/);
        expect(r.stdout).to.not.match(/\d+ failing/);
      }

      describe('project created by tronbox init', function () {
        let project;

        before(function () {
          project = path.join(cli.root, 'projects', 'metacoin');
          fs.mkdirSync(project, { recursive: true });
          const r = run(['init'], {
            cwd: project,
            env: { TRONBOX_CREATE_JAVASCRIPT_METACOIN_PROJECT_WITH_DEFAULTS: 'true' }
          });
          expect(r.status, r.stderr).to.equal(0);
          expect(fs.existsSync(path.join(project, 'contracts', 'MetaCoin.sol'))).to.equal(true);
          expect(fs.existsSync(path.join(project, 'node_modules', 'tronbox'))).to.equal(false);
        });

        it('compiles and writes the contract artifacts', () => {
          const r = run(['compile'], { cwd: project });
          expect(r.status, r.stderr).to.equal(0);
          expect(r.stdout).to.include('Compiled successfully');
          expect(fs.existsSync(path.join(project, 'build', 'contracts', 'MetaCoin.json'))).to.equal(true);
        });

        it('downloads the configured compiler when the cache is empty', () => {
          fs.removeSync(path.join(project, 'build'));
          const tmpHome = makeTmp('tronbox-pack-home-');
          try {
            const r = run(['compile'], { cwd: project, env: { HOME: tmpHome, USERPROFILE: tmpHome } });
            expect(r.status, r.stderr).to.equal(0);
            expect(r.stdout).to.include('Fetching Tron Solidity compiler version');
            expect(r.stdout).to.include('Compiled successfully');
          } finally {
            removeTmp(tmpHome);
          }
        });

        it('migrates against the development network', () => {
          const r = run(['migrate'], { cwd: project });
          expect(r.status, r.stderr).to.equal(0);
          expect(r.stdout).to.include("Using network 'development'");
          expect(r.stdout).to.include('Running migration: 1_initial_migration.js');
          expect(r.stdout).to.include('Running migration: 2_deploy_contracts.js');
          expect(r.stdout).to.include('Deploying MetaCoin');
        });

        it('runs the contract tests', () => {
          expectTestsToPass(run(['test'], { cwd: project }));
        });

        it('runs the contract tests from inside the console', async () => {
          const r = await runInConsole('test', {
            bin: cli.bin,
            binArgs: cli.binArgs,
            cwd: project,
            env: cli.env,
            timeout: COMMAND_TIMEOUT
          });
          expectTestsToPass(r);
        });

        it('flattens the contract into fully inlined source', () => {
          const r = run(['flatten', 'contracts/MetaCoin.sol'], { cwd: project });
          expect(r.status, r.stderr).to.equal(0);
          expect(r.stdout).to.match(/^\/\/ Sources flattened with TronBox v\d+\.\d+\.\d+/);
          expect(r.stdout).to.include('// File contracts/MetaCoin.sol');
          expect(r.stdout).to.include('@openzeppelin/tron-contracts');
          expect(r.stdout).to.not.match(/^\s*import\s+['"]/m);
        });
      });

      describe('unboxed project', function () {
        let project;

        before(function () {
          project = path.join(cli.root, 'projects', 'unboxed-metacoin');
          fs.mkdirSync(project, { recursive: true });
          const r = run(['unbox', 'metacoin-box'], { cwd: project });
          expect(r.status, r.stderr).to.equal(0);
          expect(r.stdout).to.include('Unbox successful');
        });

        it('runs the unboxed contract tests', () => {
          expectTestsToPass(run(['test'], { cwd: project }));
        });
      });
    });
  }

  installedPackageChecks('locally installed tarball via npx --no-install tronbox', root => {
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'tronbox-pack-host', private: true }));
    const install = spawnSync('npm', ['install', '--no-audit', '--no-fund', '--no-progress', tarball], {
      cwd: root,
      encoding: 'utf-8',
      timeout: COMMAND_TIMEOUT,
      shell: true
    });
    if (install.status !== 0)
      throw new Error(`npm install of packed tarball failed: ${install.stderr}\n${install.stdout}`);

    const localBin = path.join(root, 'node_modules', '.bin', 'tronbox');
    if (!fs.existsSync(localBin)) throw new Error(`installed tronbox binary is missing at ${localBin}`);

    return { bin: 'npx', binArgs: ['--no-install', 'tronbox'], env: {} };
  });

  installedPackageChecks('globally installed tarball via tronbox on PATH', function (root) {
    if (process.platform === 'win32') this.skip();
    const install = spawnSync(
      'npm',
      ['install', '-g', '--prefix', root, '--no-audit', '--no-fund', '--no-progress', tarball],
      {
        encoding: 'utf-8',
        timeout: COMMAND_TIMEOUT,
        shell: true
      }
    );
    if (install.status !== 0)
      throw new Error(`global npm install of packed tarball failed: ${install.stderr}\n${install.stdout}`);

    const globalBin = path.join(root, 'bin');
    const isolatedNode = path.join(globalBin, path.basename(process.execPath));
    // Reproduce a global install where the package shim sits beside Node. A
    // symlink is insufficient because process.execPath resolves through it.
    try {
      fs.linkSync(process.execPath, isolatedNode);
    } catch (error) {
      if (!['EACCES', 'EMLINK', 'ENOTSUP', 'EPERM', 'EXDEV'].includes(error.code)) throw error;
      fs.copyFileSync(process.execPath, isolatedNode);
      fs.chmodSync(isolatedNode, fs.statSync(process.execPath).mode & 0o777);
    }

    const env = { PATH: globalBin + path.delimiter + process.env.PATH };
    const resolved = spawnSync('command -v tronbox', {
      encoding: 'utf-8',
      shell: true,
      env: { ...process.env, ...env }
    });
    expect(resolved.status, resolved.stderr).to.equal(0);
    expect(resolved.stdout.trim()).to.equal(path.join(globalBin, 'tronbox'));

    const nodeProbe = spawnSync('node', ['-p', 'process.execPath'], {
      encoding: 'utf-8',
      shell: true,
      env: { ...process.env, ...env }
    });
    expect(nodeProbe.status, nodeProbe.stderr).to.equal(0);
    expect(nodeProbe.stdout.trim()).to.equal(isolatedNode);

    return { bin: 'tronbox', binArgs: [], env };
  });
});
