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
      ['init', 'compile', 'migrate', 'deploy', 'test', 'console', 'flatten', 'unbox', 'version'].forEach(c => {
        expect(r.stderr).to.include(`tronbox ${c}`);
      });
    };

    it('no args prints help', () => expectHelp(runCli([], { cwd })));
    it('help command prints help', () => expectHelp(runCli(['help'], { cwd })));
    it('--help flag prints help', () => expectHelp(runCli(['--help'], { cwd })));

    it('marks unbox as deprecated in the command list', () => {
      const r = runCli(['help'], { cwd });
      expect(r.stderr).to.include('tronbox unbox');
      expect(r.stderr).to.include('(deprecated)');
    });
  });

  describe('subcommand help', () => {
    // Subcommand --help goes to stdout (yargs default), unlike top-level --help.
    const cases = [
      ['init', 'Initialize new TronBox project'],
      ['compile', 'Compile contract source files'],
      ['migrate', 'Run migrations to deploy contracts'],
      ['deploy', 'Run migrations to deploy contracts'],
      ['test', 'Run contract tests written in JavaScript'],
      ['console', 'Run a console with contract abstractions'],
      ['flatten', 'Flattens and prints contracts and their dependencies'],
      ['unbox', 'Download a pre-built TronBox Box template'],
      ['version', 'Show version information']
    ];
    cases.forEach(([cmd, banner]) => {
      it(`${cmd} --help prints help`, () => {
        const r = runCli([cmd, '--help'], { cwd });
        expect(r.status, r.stderr).to.equal(0);
        expect(r.stdout).to.include('TronBox v');
        expect(r.stdout).to.include(banner);
        expect(r.stdout).to.include(`Usage: tronbox ${cmd}`);
        if (cmd === 'unbox') {
          expect(r.stdout).to.include('DEPRECATED: The `unbox` command');
          expect(r.stdout).to.include('a future version');
        }
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
