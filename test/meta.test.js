const { expect } = require('chai');
const { runCli, FIXTURE_DIR } = require('./helpers');

const cwd = FIXTURE_DIR;

describe('tronbox CLI', function () {
  this.timeout(30_000);

  describe('help', () => {
    const expectHelp = r => {
      expect(r.status, r.stderr).to.equal(0);
      // Help goes to stderr (yargs default).
      expect(r.stderr).to.include('TronBox v');
      expect(r.stderr).to.include('Usage: tronbox <command> [options]');
      ['init', 'compile', 'node', 'migrate', 'deploy', 'test', 'console', 'flatten', 'version'].forEach(c => {
        expect(r.stderr).to.include(`tronbox ${c}`);
      });
      expect(r.stderr).to.not.include('unbox');
    };

    it('no args prints help', () => expectHelp(runCli([], { cwd })));
    it('help command prints help', () => expectHelp(runCli(['help'], { cwd })));
    it('--help flag prints help', () => expectHelp(runCli(['--help'], { cwd })));
  });

  describe('subcommand help', () => {
    // Subcommand --help goes to stdout (yargs default), unlike top-level --help.
    const cases = [
      ['init', 'Initialize new TronBox project'],
      ['compile', 'Compile contract source files'],
      ['node', 'Start a local TRON development node'],
      ['migrate', 'Run migrations to deploy contracts'],
      ['deploy', 'Run migrations to deploy contracts'],
      ['test', 'Run contract tests written in JavaScript'],
      ['console', 'Run a console with contract abstractions'],
      ['flatten', 'Flattens and prints contracts and their dependencies'],
      ['unbox', 'The `unbox` command is no longer supported.'],
      ['version', 'Show version information']
    ];
    cases.forEach(([cmd, banner]) => {
      it(`${cmd} --help prints help`, () => {
        const r = runCli([cmd, '--help'], { cwd });
        expect(r.status, r.stderr).to.equal(0);
        expect(r.stdout).to.include('TronBox v');
        expect(r.stdout).to.include(banner);
        expect(r.stdout).to.include(`Usage: tronbox ${cmd}`);
      });
    });
  });

  describe('version', () => {
    it('prints TronBox and bundled solc versions', () => {
      const r = runCli(['version'], { cwd });
      expect(r.status, r.stderr).to.equal(0);
      expect(r.stdout).to.match(/TronBox v\d+\.\d+\.\d+/);
      expect(r.stdout).to.match(/Solidity v\d+\.\d+\.\d+/);
    });
  });

  describe('unknown command', () => {
    ['nosuchcommand', 'toString', '__proto__'].forEach(name => {
      it(`${name} exits non-zero as an invalid command`, () => {
        const r = runCli([name], { cwd });
        expect(r.status).to.not.equal(0);
        expect(r.stderr).to.include(`\`tronbox ${name}\` is an invalid command`);
      });
    });
  });
});
