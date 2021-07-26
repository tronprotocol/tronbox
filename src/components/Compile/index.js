const Profiler = require('./profiler')
const OS = require('os')
const path = require('path')
const CompileError = require('./compileerror')
const expect = require('@truffle/expect')
const find_contracts = require('@truffle/contract-sources')
const Config = require('../Config')

// Most basic of the compile commands. Takes a hash of sources, where
// the keys are file or module paths and the values are the bodies of
// the contracts. Does not evaulate dependencies that aren't already given.
//
// Default options:
// {
//   strict: false,
//   quiet: false,
//   logger: console
// }

const preReleaseCompilerWarning = require('./messages').preReleaseCompilerWarning

const compile = function (sources, options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }

  if (!options.logger) {
    options.logger = console
  }

  expect.options(options, [
    'contracts_directory',
    'solc'
  ])

  // Load solc module only when compilation is actually required.
  const {getWrapper} = require('../TronSolc')

  const solc = getWrapper(options)
  // Clean up after solc.
  const listeners = process.listeners('uncaughtException')
  const solc_listener = listeners[listeners.length - 1]

  if (solc_listener) {
    process.removeListener('uncaughtException', solc_listener)
  }


  // Ensure sources have operating system independent paths
  // i.e., convert backslashes to forward slashes; things like C: are left intact.
  const operatingSystemIndependentSources = {}
  const originalPathMappings = {}

  Object.keys(sources).forEach(function (source) {
    // Turn all backslashes into forward slashes
    let replacement = source.replace(/\\/g, '/')

    // Turn G:/.../ into /G/.../ for Windows
    if (replacement.length >= 2 && replacement[1] === ':') {
      replacement = '/' + replacement
      replacement = replacement.replace(':', '')
    }

    // Save the result
    operatingSystemIndependentSources[replacement] = sources[source]

    // Map the replacement back to the original source path.
    originalPathMappings[replacement] = source
  })

  const solcStandardInput = {
    language: 'Solidity',
    sources: {},
    settings: {
      evmVersion: options.solc.evmVersion,
      optimizer: options.solc.optimizer,
      outputSelection: {
        '*': {
          '': [
            'legacyAST',
            'ast'
          ],
          '*': [
            'abi',
            'evm.bytecode.object',
            'evm.bytecode.sourceMap',
            'evm.deployedBytecode.object',
            'evm.deployedBytecode.sourceMap'
          ]
        },
      }
    }
  }

  // Nothing to compile? Bail.
  if (!Object.keys(sources).length) {
    return callback(null, [], [])
  }

  Object.keys(operatingSystemIndependentSources).forEach(function (file_path) {
    solcStandardInput.sources[file_path] = {
      content: operatingSystemIndependentSources[file_path]
    }
  })

  const result = solc[solc.compileStandard ? 'compileStandard' : 'compile'](JSON.stringify(solcStandardInput))

  const standardOutput = JSON.parse(result)

  let errors = standardOutput.errors || []
  let warnings = []

  if (options.strict !== true) {
    warnings = errors.filter(function (error) {
      return error.severity === 'warning' && error.message !== preReleaseCompilerWarning
    })

    errors = errors.filter(function (error) {
      return error.severity !== 'warning'
    })

    if (options.quiet !== true && warnings.length > 0) {
      options.logger.log(OS.EOL + 'Compilation warnings encountered:' + OS.EOL)
      options.logger.log(warnings.map(function (warning) {
        return warning.formattedMessage
      }).join())
    }
  }

  if (errors.length > 0) {
    options.logger.log('')
    return callback(new CompileError(standardOutput.errors.map(function (error) {
      return error.formattedMessage
    }).join()))
  }

  const contracts = standardOutput.contracts

  const files = []
  Object.keys(standardOutput.sources).forEach(function (filename) {
    const source = standardOutput.sources[filename]
    files[source.id] = originalPathMappings[filename]
  })

  const returnVal = {}

  // This block has comments in it as it's being prepared for solc > 0.4.10
  Object.keys(contracts).forEach(function (source_path) {
    const files_contracts = contracts[source_path]

    Object.keys(files_contracts).forEach(function (contract_name) {
      const contract = files_contracts[contract_name]

      const contract_definition = {
        contract_name: contract_name,
        sourcePath: originalPathMappings[source_path], // Save original source path, not modified ones
        source: operatingSystemIndependentSources[source_path],
        sourceMap: contract.evm.bytecode.sourceMap,
        deployedSourceMap: contract.evm.deployedBytecode.sourceMap,
        legacyAST: standardOutput.sources[source_path].legacyAST,
        ast: standardOutput.sources[source_path].ast,
        abi: contract.abi,
        bytecode: '0x' + contract.evm.bytecode.object,
        deployedBytecode: '0x' + contract.evm.deployedBytecode.object,
        unlinked_binary: '0x' + contract.evm.bytecode.object, // deprecated
        compiler: {
          name: 'solc',
          version: solc.version()
        }
      }

      // Reorder ABI so functions are listed in the order they appear
      // in the source file. Solidity tests need to execute in their expected sequence.
      contract_definition.abi = orderABI(contract_definition)

      // Go through the link references and replace them with older-style
      // identifiers. We'll do this until we're ready to making a breaking
      // change to this code.
      const bytecodeLinkRef = contract.evm.bytecode.linkReferences || {}
      Object.keys(bytecodeLinkRef).forEach(function (file_name) {
        const fileLinks = bytecodeLinkRef[file_name]

        Object.keys(fileLinks).forEach(function (library_name) {
          const linkReferences = fileLinks[library_name] || []

          contract_definition.bytecode = replaceLinkReferences(contract_definition.bytecode, linkReferences, library_name)
          contract_definition.unlinked_binary = replaceLinkReferences(contract_definition.unlinked_binary, linkReferences, library_name)
        })
      })

      // Now for the deployed bytecode
      const deployedBytecodeLinkRef = contract.evm.deployedBytecode.linkReferences || {}
      Object.keys(deployedBytecodeLinkRef).forEach(function (file_name) {
        const fileLinks = deployedBytecodeLinkRef[file_name]

        Object.keys(fileLinks).forEach(function (library_name) {
          const linkReferences = fileLinks[library_name] || []

          contract_definition.deployedBytecode = replaceLinkReferences(contract_definition.deployedBytecode, linkReferences, library_name)
        })
      })

      returnVal[contract_name] = contract_definition
    })
  })

  callback(null, returnVal, files)
}

function replaceLinkReferences(bytecode, linkReferences, libraryName) {
  let linkId = '__' + libraryName

  while (linkId.length < 40) {
    linkId += '_'
  }

  linkReferences.forEach(function (ref) {
    // ref.start is a byte offset. Convert it to character offset.
    const start = (ref.start * 2) + 2

    bytecode = bytecode.substring(0, start) + linkId + bytecode.substring(start + 40)
  })

  return bytecode
}

function orderABI(contract) {
  const { abi, contractName, ast } = contract;

  if (!abi) {
    return []; //Yul doesn't return ABIs, but we require something
  }

  if (!ast || !ast.nodes) {
    return abi;
  }

  // AST can have multiple contract definitions, make sure we have the
  // one that matches our contract
  const contractDefinition = ast.nodes.find(
    ({ nodeType, name }) =>
      nodeType === "ContractDefinition" && name === contractName
  );

  if (!contractDefinition || !contractDefinition.nodes) {
    return abi;
  }

  // Find all function definitions
  const orderedFunctionNames = contractDefinition.nodes
    .filter(({ nodeType }) => nodeType === "FunctionDefinition")
    .map(({ name: functionName }) => functionName);

  // Put function names in a hash with their order, lowest first, for speed.
  const functionIndexes = orderedFunctionNames
    .map((functionName, index) => ({ [functionName]: index }))
    .reduce((a, b) => Object.assign({}, a, b), {});

  // Construct new ABI with functions at the end in source order
  return [
    ...abi.filter(({ name }) => functionIndexes[name] === undefined),

    // followed by the functions in the source order
    ...abi
      .filter(({ name }) => functionIndexes[name] !== undefined)
      .sort(
        ({ name: a }, { name: b }) => functionIndexes[a] - functionIndexes[b]
      )
  ];
}


// contracts_directory: String. Directory where .sol files can be found.
// quiet: Boolean. Suppress output. Defaults to false.
// strict: Boolean. Return compiler warnings as errors. Defaults to false.
compile.all = function (options, callback) {
  find_contracts(options.contracts_directory, function (err, files) {
    options.paths = files
    compile.with_dependencies(options, callback)
  })
}

// contracts_directory: String. Directory where .sol files can be found.
// build_directory: String. Optional. Directory where .sol.js files can be found. Only required if `all` is false.
// all: Boolean. Compile all sources found. Defaults to true. If false, will compare sources against built files
//      in the build directory to see what needs to be compiled.
// quiet: Boolean. Suppress output. Defaults to false.
// strict: Boolean. Return compiler warnings as errors. Defaults to false.
compile.necessary = function (options, callback) {
  options.logger = options.logger || console

  Profiler.updated(options, function (err, updated) {
    if (err) return callback(err)

    if (updated.length === 0 && options.quiet !== true) {
      return callback(null, [], {})
    }

    options.paths = updated
    compile.with_dependencies(options, callback)
  })
}

compile.with_dependencies = function (options, callback) {
  options.logger = options.logger || console
  options.contracts_directory = options.contracts_directory || process.cwd()

  expect.options(options, [
    'paths',
    'working_directory',
    'contracts_directory',
    'resolver'
  ])

  const config = Config.default().merge(options)

  Profiler.required_sources(config.with({
    paths: options.paths,
    base_path: options.contracts_directory,
    resolver: options.resolver
  }), function (err, result) {
    if (err) return callback(err)

    if (!options.quiet) {
      Object.keys(result).sort().forEach(function (import_path) {
        let display_path = import_path
        if (path.isAbsolute(import_path)) {
          display_path = '.' + path.sep + path.relative(options.working_directory, import_path)
        }
        options.logger.log('Compiling ' + display_path + '...')
      })
    }

    compile(result, options, callback)
  })
}

module.exports = compile
