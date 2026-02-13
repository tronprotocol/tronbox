const { assert, expect } = require('chai');
const fs = require('fs');
const path = require('path');
const command = require('../../../src/lib/commands/compile');

contract('####### solcjsonInput test #######', function () {
    const testContractsDir = path.join(__dirname, '../contracts');
    const buildInfoDir = path.join(__dirname, '../build-info');
    const buildDir = path.join(__dirname, '../build');
    const workingDir = path.join(__dirname, '..');

    before(function () {
        // Delete previous build & build-info folder from last test run
        console.log('Cleaning up previous build artifacts...');
        if (fs.existsSync(buildInfoDir)) {
            try {
                const files = fs.readdirSync(buildInfoDir);
                files.forEach(f => {
                    if (f.endsWith('.json')) {
                        fs.unlinkSync(path.join(buildInfoDir, f));
                    }
                });
            } catch (e) {
                // Ignore cleanup errors
            }
        }

        //Clean up generated build-info files
        if (fs.existsSync(buildDir)) {
            try {
                const files = fs.readdirSync(buildDir);
                files.forEach(f => {
                    if (f.endsWith('.json')) {
                        fs.unlinkSync(path.join(buildDir, f));
                    }
                });
            } catch (e) {
                // Ignore cleanup errors
            }
        }
    });



    it('tc-solc-001: should have correct command structure', function () {
        assert.equal(command.command, 'compile [contracts...]');
        assert.include(command.describe, 'Compile contract source files');
    });

    it('tc-solc-002: should handle compilation errors for non-existent files', function (done) {
        this.timeout(30000);

        const options = {
            contracts: [path.join(testContractsDir, 'NonExistent.sol')],
            working_directory: workingDir
        };

        command.run(options, function (err) {
            // Should error on non-existent file
            assert.exists(err, 'Should return an error for non-existent contract file');
            assert.isTrue(err instanceof Error, 'Error should be an Error instance');

            done();
        });
    });

    it('tc-solc-003: should verify actual contract files exist', function () {
        // Ensure test contracts are available
        assert.isTrue(fs.existsSync(path.join(testContractsDir, 'SimpleToken.sol')), 'SimpleToken.sol should exist');
        assert.isTrue(fs.existsSync(path.join(testContractsDir, 'Greeter.sol')), 'Greeter.sol should exist');
    });

    it('tc-solc-004: should properly resolve contract file paths', function (done) {
        this.timeout(30000);

        const options = {
            // Use relative paths as would be provided by the command
            contracts: [
                path.join(testContractsDir, 'SimpleToken.sol')
            ],
            working_directory: workingDir
        };

        command.run(options, function (err, contracts) {
            if (err) return done(err);

            assert.exists(contracts, 'Contracts should compile with absolute paths');
            done();
        });
    });

    it('tc-solc-005: should compile specific contract', function (done) {
        this.timeout(30000); // Compilation can take time

        const contractPath = path.join(testContractsDir, 'Greeter.sol');
        const options = {
            contracts: [contractPath],
            working_directory: workingDir
        };

        command.run(options, function (err, contracts) {
            if (err) return done(err);

            // Verify compilation succeeded with contracts
            assert.exists(contracts, 'Contracts should be returned from compilation');
            assert.isObject(contracts, 'Contracts should be an object');
            assert.isTrue(Object.keys(contracts).length > 0, 'Should have compiled contracts');

            done();
        });
    });

    it('tc-solc-006: should compile multiple contracts', function (done) {
        this.timeout(30000);

        const options = {
            contracts: [
                path.join(testContractsDir, 'SimpleToken.sol'),
                path.join(testContractsDir, 'Greeter.sol')
            ],
            working_directory: workingDir
        };

        command.run(options, function (err, contracts) {
            if (err) return done(err);

            assert.exists(contracts, 'Multiple contracts should compile');
            assert.isTrue(Object.keys(contracts).length > 0, 'Should have compiled contracts');

            done();
        });
    });


    it('tc-solc-007: should compile all contracts when --all flag is used', function (done) {
        this.timeout(30000);

        const options = {
            all: true,
            working_directory: workingDir
        };

        command.run(options, function (err, contracts) {
            if (err) return done(err);

            // Should compile all contracts in the directory
            assert.exists(contracts, 'All contracts should be compiled');
            assert.isObject(contracts, 'Should return contracts object');

            done();
        });
    });

    it('tc-solc-008: should suppress output with --quiet option', function (done) {
        this.timeout(30000);

        const options = {
            quiet: true,
            all: true,
            working_directory: workingDir
        };

        command.run(options, function (err) {
            if (err) return done(err);

            // Logger should be a no-op object with a `log` function
            assert.isObject(options.logger, 'Logger should be set');
            assert.isFunction(options.logger.log, 'Logger.log should be a function');

            done();
        });
    });

    it('tc-solc-009: should suppress output with --silent option', function (done) {
        this.timeout(30000);

        const options = {
            silent: true,
            all: true,
            working_directory: workingDir
        };

        command.run(options, function (err) {
            if (err) return done(err);

            // Logger should be a no-op object with a `log` function
            assert.isObject(options.logger, 'Logger should be set');
            assert.isFunction(options.logger.log, 'Logger.log should be a function');

            done();
        });
    });

    it('tc-solc-010: should generate build-info JSON files with compilation data', function (done) {
        this.timeout(30000);

        const options = {
            all: true,
            working_directory: workingDir
        };

        command.run(options, function (err, contracts) {
            if (err) return done(err);

            // Check that build-info directory has JSON files
            const files = fs.readdirSync(buildInfoDir);
            const jsonFiles = files.filter(f => f.endsWith('.json'));

            assert.isTrue(jsonFiles.length > 0, 'Build-info directory should contain JSON files after compilation');

            // Verify each JSON file contains valid solc standard input format
            jsonFiles.forEach(file => {
                const content = fs.readFileSync(path.join(buildInfoDir, file), 'utf8');
                const json = JSON.parse(content);

                // Check for solc standard JSON input properties
                assert.exists(json.language, `${file} should have language property`);
                assert.equal(json.language, 'Solidity', 'Language should be Solidity');
                assert.exists(json.sources, `${file} should have sources property`);
                assert.isObject(json.sources, 'sources should be an object');
                assert.exists(json.settings, `${file} should have settings property`);
                assert.isObject(json.settings, 'settings should be an object');
                assert.exists(json.settings.outputSelection, 'settings should have outputSelection');

                // Verify outputSelection has expected structure described in solc documentation (current 0.8.25)
                assert.exists(json.settings.outputSelection['*'], 'outputSelection should have * key');
                assert.exists(json.settings.outputSelection['*']['*'], 'outputSelection * should have * key');
                assert.isArray(json.settings.outputSelection['*']['*'], 'outputSelection * * should be an array');
                assert.include(json.settings.outputSelection['*']['*'], 'abi', 'outputSelection should include abi');
                assert.include(json.settings.outputSelection['*']['*'], 'devdoc', 'outputSelection should include devdoc');
                assert.include(json.settings.outputSelection['*']['*'], 'userdoc', 'outputSelection should include userdoc');
                assert.include(json.settings.outputSelection['*']['*'], 'metadata', 'outputSelection should include metadata');
                assert.include(json.settings.outputSelection['*']['*'], 'evm.bytecode.object', 'outputSelection should include evm.bytecode.object');
                assert.include(json.settings.outputSelection['*']['*'], 'evm.bytecode.sourceMap', 'outputSelection should include evm.bytecode.sourceMap');
                assert.include(json.settings.outputSelection['*']['*'], 'evm.bytecode.linkReferences', 'outputSelection should include evm.bytecode.linkReferences');
                assert.include(json.settings.outputSelection['*']['*'], 'evm.deployedBytecode.object', 'outputSelection should include evm.deployedBytecode.object');
                assert.include(json.settings.outputSelection['*']['*'], 'evm.deployedBytecode.sourceMap', 'outputSelection should include evm.deployedBytecode.sourceMap');
                assert.include(json.settings.outputSelection['*']['*'], 'storageLayout', 'outputSelection should include storageLayout');
                assert.include(json.settings.outputSelection['*']['*'], 'evm.methodIdentifiers', 'outputSelection should include evm.methodIdentifiers');

            });

            done();
        });
    });

    it('tc-solc-011: should return compiled contracts with proper ABI and bytecode', function (done) {
        this.timeout(30000);

        const options = {
            contracts: [path.join(testContractsDir, 'SimpleToken.sol')],
            working_directory: workingDir
        };

        command.run(options, function (err, contracts) {
            if (err) return done(err);

            // Verify contract structure matches what solc produces
            assert.isObject(contracts, 'Contracts should be an object');
            assert.isTrue(Object.keys(contracts).length > 0, 'Should have at least one compiled contract');

            // Check each contract's structure
            Object.keys(contracts).forEach(contractName => {
                const contract = contracts[contractName];
                assert.exists(contract.abi, `Contract ${contractName} should have abi`);
                assert.isArray(contract.abi, 'abi should be an array');
                assert.exists(contract.bytecode, `Contract ${contractName} should have bytecode`);
            });

            done();
        });
    });

    it('tc-solc-012: should deploy simple contract using new artifact schema ', async function () {
        this.timeout(30000);


        const Greeter = artifacts.require('./Greeter.sol');
        const c = await Greeter.new("Hello, Tronbox!");
        const greeting = await c.greet();
        assert.equal(greeting, "Hello, Tronbox!", "Greeter should return the correct greeting");
    });

    it('tc-solc-013: should deploy OpenZeppelin deps contract using new artifact schema ', async function () {
        this.timeout(30000);


        const SimpleToken = artifacts.require('./SimpleToken.sol');
        const c = await SimpleToken.new(7777777);
        const minting = await c.mint("TJDMQzjJSh5eC8WezVtnDXDuWXAwjV23eF", 1000);
        assert.lengthOf(minting, 64, 'Minting should return a transaction hash of length 64');
    });



});
