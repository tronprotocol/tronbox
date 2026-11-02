// Requires a local TRON development node running on http://127.0.0.1:9090.

const { expect } = require('chai');
const path = require('path');
const fs = require('fs-extra');
const { runCli, runInConsole, makeTmp, removeTmp, FIXTURE_DIR } = require('./helpers');

const cwd = FIXTURE_DIR;

describe('tronbox console', function () {
  this.timeout(90_000);

  it('starts a REPL with the development network prompt and exits cleanly', () => {
    const r = runCli(['console'], { cwd, input: '.exit\n' });
    expect(r.status, r.stderr).to.equal(0);
    expect(r.stdout).to.include('tronbox(development)>');
  });

  it('prints console.log output and records it in the history file', () => {
    const historyFile = path.join(cwd, '.console_history');
    fs.removeSync(historyFile);
    const r = runCli(['console'], {
      cwd,
      isTTY: true,
      input: 'console.log("hello-from-repl")\n'
    });
    expect(r.status, r.stderr).to.equal(0);
    // A terminal REPL echoes its input, so `include` would match the echo.
    expect(r.stdout).to.match(/^hello-from-repl$/m);
    expect(fs.readFileSync(historyFile, 'utf-8')).to.include('console.log("hello-from-repl")');
  });

  it('reports a ReferenceError for an unknown identifier', () => {
    const r = runCli(['console'], { cwd, input: 'nosuchidentifier\n.exit\n' });
    expect(r.status, r.stderr).to.equal(0);
    expect(r.stdout + r.stderr).to.match(/nosuchidentifier is not defined/);
  });

  it('evaluates expressions and object literals with the native REPL', async function () {
    const r = await runInConsole(['6 * 7', '{a: 1}', '{\n  a: 1,\n  nested: { b: 2 }\n}'], { cwd });
    expect(r.status, r.stderr).to.equal(0);
    expect(r.stdout).to.match(/> 42\b/);
    expect(r.stdout).to.match(/> \{ a: 1 \}\r?\n/);
    expect(r.stdout).to.include('{ a: 1, nested: { b: 2 } }');
  });

  it('retains awaited bindings and refreshes contract abstractions after compile', async function () {
    expect(runCli(['compile'], { cwd }).status).to.equal(0);

    const r = await runInConsole(
      [
        'const savedValue = await Promise.resolve(41); const previousContract = Migrations',
        'compile --all',
        '[savedValue + 1, Migrations.contractName, previousContract === Migrations, typeof tronWeb]'
      ],
      { cwd }
    );
    expect(r.status, r.stderr).to.equal(0);
    expect(r.stdout).to.match(/> \[ 42, 'Migrations', false, 'object' \]\r?\n/);
  });

  it('built-in `help` prints the command list', () => {
    const r = runCli(['console'], { cwd, input: 'help\n.exit\n' });
    expect(r.status, r.stderr).to.equal(0);
    // Yargs writes the help banner to stderr.
    expect(r.stderr).to.include('Usage: tronbox <command> [options]');
    ['compile', 'migrate', 'test'].forEach(c => expect(r.stderr).to.include(c));
  });

  it('--network changes the prompt label', () => {
    const r = runCli(['console', '--network', 'shasta'], {
      cwd,
      input: '.exit\n'
    });
    expect(r.status, r.stderr).to.equal(0);
    expect(r.stdout).to.include('tronbox(shasta)>');
  });

  it('--network for an unknown network is rejected', () => {
    const r = runCli(['console', '--network', 'nope'], { cwd, input: '.exit\n' });
    expect(r.status).to.not.equal(0);
    expect(r.stderr).to.include('does not exist in your "tronbox-config.js"');
  });

  it('runs `test` from inside the REPL', async function () {
    const r = await runInConsole('test', { cwd });
    expect(r.status, r.stderr).to.equal(0);
    expect(r.stdout).to.match(/\d+ passing/);
    expect(r.stdout).to.not.match(/\d+ failing/);
  });

  it('rejects `test --network` when it differs from the REPL', () => {
    const r = runCli(['console'], { cwd, input: 'test --network shasta\n.exit\n' });
    expect(r.status, r.stderr).to.equal(0);
    expect(r.stdout + r.stderr).to.include('the current REPL is using --network=development');
  });

  it('rejects `test --evm` from a non-EVM REPL', () => {
    const r = runCli(['console'], { cwd, input: 'test --evm\n.exit\n' });
    expect(r.status, r.stderr).to.equal(0);
    expect(r.stdout + r.stderr).to.include('the current REPL is not in EVM mode');
  });

  it('preserves implicit Promise resolution, thenables and rejection formatting', async function () {
    const cases = [
      ['new Error("error: promise-error-marker")', 'promise-error-marker'],
      ['"Error promise-string-marker"', 'promise-string-marker'],
      ['{ message: "ERROR: promise-object-marker" }', 'promise-object-marker'],
      ['{ reason: "object-rejection" }', '[object Object]'],
      ['undefined', 'undefined'],
      ['null', 'null'],
      ['false', 'false'],
      ['0', '0'],
      ['""', '']
    ];
    const r = await runInConsole(
      [
        'Promise.resolve(42)',
        'let getterReads = 0; let delayedSettled = 0',
        '({ get then() { getterReads++; return resolve => resolve(42); } })',
        'new Promise(resolve => setTimeout(() => { delayedSettled++; resolve(43); }, 20))',
        'new Promise((_, reject) => setTimeout(() => { delayedSettled++; reject(new Error("error: delayed-promise-marker")); }, 20))',
        ...cases.map(([reason]) => `Promise.reject(${reason})`),
        '[getterReads, delayedSettled, 6 * 7]'
      ],
      { cwd }
    );
    expect(r.status, r.stderr).to.equal(0);
    expect(r.stdout.match(/> 42\r?\n/g)).to.have.lengthOf(2);
    expect(r.stdout).to.match(/> 43\r?\n/);
    expect(r.stdout).to.match(/> \[ 1, 2, 42 \]\r?\n/);
    expect(r.stderr.split(/\r?\n/).filter(line => line.startsWith('ERROR: '))).to.deep.equal([
      'ERROR: delayed-promise-marker',
      ...cases.map(([, message]) => `ERROR: ${message}`)
    ]);
  });

  it('supports await expressions, persistent const/let bindings and injected tronWeb calls', async function () {
    const r = await runInConsole(
      [
        'const answer = await Promise.resolve(40)',
        'let counter = await Promise.resolve(1)',
        'counter += 1',
        '[answer, counter, Number.isInteger((await tronWeb.trx.getCurrentBlock()).block_header.raw_data.number)]'
      ],
      { cwd }
    );
    expect(r.status, r.stderr).to.equal(0);
    expect(r.stdout).to.match(/> \[ 40, 2, true \]\r?\n/);
  });

  it('supports await with the injected EVM provider', () => {
    const r = runCli(['console', '--evm'], {
      cwd,
      input:
        'console.info("EVM_AWAIT_RESULT", Number.isInteger(await tronWrap._ethers.provider.getBlockNumber()), typeof ethers)\n'
    });
    expect(r.status, r.stderr).to.equal(0);
    expect(r.stdout).to.include('EVM_AWAIT_RESULT true object');
  });

  it('preserves native await errors and results alongside implicit Promise handling', async function () {
    const r = await runInConsole(
      [
        'await Promise.resolve(42)',
        'const savedBeforeError = await Promise.resolve(41); const requestBeforeError = tronWeb.fullNode.request',
        'tronWeb.fullNode.request = async () => ({}); void 0',
        'await tronWeb.trx.getBlock()',
        'await tronWeb.trx.getBlock(111)',
        'tronWeb.trx.getBlock(111)',
        'tronWeb.trx.getBlock()',
        'tronWeb.fullNode.request = requestBeforeError; [savedBeforeError + 1, _error.message]',
        'await 0; Promise.resolve(42)'
      ],
      { cwd }
    );
    expect(r.status, r.stderr).to.equal(0);
    expect(r.stdout).to.match(/> 42\r?\n/);
    expect(r.stderr.split(/\r?\n/).filter(line => line.startsWith('ERROR: '))).to.deep.equal([
      'ERROR: Block not found',
      'ERROR: No block identifier provided'
    ]);
    expect(r.stdout).to.match(/Uncaught[:\s]+Error: No block identifier provided/);
    expect(r.stdout).to.match(/Uncaught[:\s]+Error: Block not found/);
    expect(r.stdout.match(/Uncaught/g)).to.have.lengthOf(2);
    expect(r.stdout).to.match(/> \[ 42, 'Block not found' \]\r?\n/);
    expect(r.stdout).to.match(/> Promise \{\s*42(?:,|\s*\})/);
  });

  it('recovers from syntax errors, runtime errors and rejected await without repeating side effects', async function () {
    const r = await runInConsole(
      [
        'const savedConst = 40; let savedLet = 1; var savedVar = 1; let throws = 0',
        'const = 1',
        'JSON.parse("{")',
        'throws++; throw new SyntaxError("runtime-syntax-marker")',
        'throw new Error("runtime-error-marker")',
        'await Promise.reject(new Error("await-error-marker")); throws += 100',
        '[savedConst, ++savedLet, ++savedVar, throws, typeof tronWeb]'
      ],
      { cwd }
    );
    expect(r.status, r.stderr).to.equal(0);
    for (const message of ['SyntaxError', 'runtime-syntax-marker', 'runtime-error-marker', 'await-error-marker']) {
      expect(r.stdout + r.stderr).to.include(message);
    }
    expect(r.stdout).to.match(/> \[ 40, 2, 2, 1, 'object' \]\r?\n/);
  });

  it('keeps awaited bindings usable after a failed compile command', async function () {
    const r = await runInConsole(
      [
        'const savedAfterFailure = await Promise.resolve(41)',
        'compile --all',
        '[savedAfterFailure + 1, typeof tronWeb]'
      ],
      { cwd, env: { CONTRACTS_DIR: 'contracts_syntax_error', BUILD_DIR: 'build_console_failure' } }
    );
    expect(r.status, r.stderr).to.equal(0);
    expect(r.stdout + r.stderr).to.include('ParserError');
    expect(r.stdout).to.match(/> \[ 42, 'object' \]\r?\n/);
  });

  it('accepts multiline await and keeps whitespace in multiline strings', async function () {
    const r = await runInConsole(
      [
        'const multilineValue = await Promise.resolve(\n  40\n)',
        'const multilineText = `first\n  second\nthird`',
        '[multilineValue + 2, multilineText === "first\\n  second\\nthird"]'
      ],
      { cwd }
    );
    expect(r.status, r.stderr).to.equal(0);
    expect(r.stdout).to.match(/> \[ 42, true \]\r?\n/);
    expect(r.stdout + r.stderr).not.to.include('SyntaxError');
  });

  it('loads awaited declarations without changing whole-file strict mode', async function () {
    const directory = makeTmp('tronbox-console-load-');
    try {
      const strictFile = path.join(directory, 'strict.js');
      const awaitFile = path.join(directory, 'await.js');
      fs.writeFileSync(strictFile, '"use strict";\nloadedUndeclared = 3;\n');
      fs.writeFileSync(awaitFile, 'const loadedValue = await Promise.resolve(41);\nPromise.resolve(42);\n');
      const r = runCli(['console'], {
        cwd,
        isTTY: true,
        input:
          `.load ${strictFile}\n.load ${awaitFile}\n` +
          'console.info("LOADED_RESULT", typeof loadedUndeclared, loadedValue + 1)\n.exit\n'
      });
      expect(r.status, r.stderr).to.equal(0);
      expect(r.stdout + r.stderr).to.include('loadedUndeclared is not defined');
      expect(r.stdout + r.stderr).not.to.include('has already been declared');
      expect(r.stdout).to.match(/(?:^|\r?\n)LOADED_RESULT undefined 42\r?\n/);
    } finally {
      removeTmp(directory);
    }
  });

  it('cancels editor input with Ctrl+C and submits an await block with Ctrl+D', () => {
    const r = runCli(['console'], {
      cwd,
      isTTY: true,
      input:
        '.editor\nconst cancelledValue = 999\n\x03' +
        '.editor\nconst editorValue = await Promise.resolve(42)\n' +
        'console.info("EDITOR_RESULT", editorValue, typeof cancelledValue)\n\x04'
    });
    expect(r.status, r.stderr).to.equal(0);
    expect(r.stdout).to.match(/(?:^|\r?\n)EDITOR_RESULT 42 undefined\r?\n/);
  });

  it('interrupts a pending await with Ctrl+C and keeps the context usable', () => {
    const r = runCli(['console'], {
      cwd,
      isTTY: true,
      input:
        'const keptValue = 41; await new Promise(() => {})\n\x03' +
        'console.info("AFTER_INTERRUPT", keptValue + 1)\n.exit\n'
    });
    expect(r.status, r.stderr).to.equal(0);
    expect(r.stdout + r.stderr).to.include('Script execution was interrupted');
    expect(r.stdout).to.match(/(?:^|\r?\n)AFTER_INTERRUPT 42\r?\n/);
  });
});
