const pkgVersion = '2.0.1';
const Ajv = require('ajv');

const contractObjectSchema = require('./spec/contract-object.spec.json');
const networkObjectSchema = require('./spec/network-object.spec.json');
const abiSchema = require('./spec/abi.spec.json');

/**
 * Property definitions for Contract Objects
 *
 * Describes canonical output properties as sourced from some "dirty" input
 * object. Describes normalization process to account for deprecated and/or
 * nonstandard keys and values.
 *
 * Maps (key -> property) where:
 *  - `key` is the top-level output key matching up with those in the schema
 *  - `property` is an object with optional values:
 *      - `sources`: list of sources (see below); default `key`
 *      - `transform`: function(value) -> transformed value; default x -> x
 *
 * Each source represents a means to select a value from dirty object.
 * Allows:
 *  - dot-separated (`.`) string, corresponding to path to value in dirty
 *    object
 *  - function(dirtyObj) -> (cleanValue | undefined)
 *
 * The optional `transform` parameter standardizes value regardless of source,
 * for purposes of ensuring data type and/or string schemas.
 */
const properties = {
  contractName: {
    sources: ['contractName', 'contract_name']
  },
  abi: {
    sources: ['abi', 'interface'],
    transform: function (value) {
      if (typeof value === 'string') {
        try {
          value = JSON.parse(value);
        } catch (e) {
          value = undefined;
        }
      }
      return value;
    }
  },
  bytecode: {
    sources: ['bytecode', 'binary', 'unlinked_binary', 'evm.bytecode.object'],
    transform: function (value) {
      if (value && value.indexOf('0x') !== 0) {
        value = '0x' + value;
      }
      return value;
    }
  },
  deployedBytecode: {
    sources: ['deployedBytecode', 'runtimeBytecode', 'evm.deployedBytecode.object'],
    transform: function (value) {
      if (value && value.indexOf('0x') !== 0) {
        value = '0x' + value;
      }
      return value;
    }
  },
  sourceMap: {
    sources: ['sourceMap', 'srcmap', 'evm.bytecode.sourceMap']
  },
  deployedSourceMap: {
    sources: ['deployedSourceMap', 'srcmapRuntime', 'evm.deployedBytecode.sourceMap']
  },
  source: {},
  sourcePath: {},
  ast: {},
  legacyAST: {
    transform: function (value, obj) {
      const schemaVersion = obj.schemaVersion || '0.0.0';

      // legacyAST introduced in v2.0.0
      if (schemaVersion[0] < 2) {
        return obj.ast;
      } else {
        return value;
      }
    }
  },
  compiler: {},
  networks: {
    transform: function (value) {
      if (value === undefined) {
        value = {};
      }
      return value;
    }
  },
  schemaVersion: {
    sources: ['schemaVersion', 'schema_version']
  },
  updatedAt: {
    sources: ['updatedAt', 'updated_at'],
    transform: function (value) {
      if (typeof value === 'number') {
        value = new Date(value).toISOString();
      }
      return value;
    }
  }
};

/**
 * Construct a getter for a given key, possibly applying some post-retrieve
 * transformation on the resulting value.
 *
 * @return {Function} Accepting dirty object and returning value || undefined
 */
function getter(key, transform) {
  if (transform === undefined) {
    transform = function (x) {
      return x;
    };
  }

  return function (obj) {
    try {
      return transform(obj[key]);
    } catch (e) {
      return undefined;
    }
  };
}

/**
 * Chains together a series of function(obj) -> value, passing resulting
 * returned value to next function in chain.
 *
 * Accepts any number of functions passed as arguments
 * @return {Function} Accepting initial object, returning end-of-chain value
 *
 * Assumes all intermediary values to be objects, with well-formed sequence
 * of operations.
 */
function chain() {
  const getters = Array.prototype.slice.call(arguments);
  return function (obj) {
    return getters.reduce(function (cur, get) {
      return get(cur);
    }, obj);
  };
}

// Schema module
//

const TruffleContractSchema = {
  // Return a promise to validate a contract object
  // - Resolves as validated `contractObj`
  // - Rejects with list of errors from schema validator
  validate: function (contractObj) {
    const ajv = new Ajv({ useDefaults: true });
    ajv.addSchema(abiSchema);
    ajv.addSchema(networkObjectSchema);
    ajv.addSchema(contractObjectSchema);
    if (ajv.validate('contract-object.spec.json', contractObj)) {
      return contractObj;
    } else {
      throw ajv.errors;
    }
  },

  // accepts as argument anything that can be turned into a contract object
  // returns a contract object
  normalize: function (objDirty, options) {
    options = options || {};
    const normalized = {};

    // iterate over each property
    Object.keys(properties).forEach(function (key) {
      const property = properties[key];
      let value; // normalized value || undefined

      // either used the defined sources or assume the key will only ever be
      // listed as its canonical name (itself)
      const sources = property.sources || [key];

      // iterate over sources until value is defined or end of list met
      for (let i = 0; value === undefined && i < sources.length; i++) {
        let source = sources[i];
        // string refers to path to value in objDirty, split and chain
        // getters
        if (typeof source === 'string') {
          const traversals = source.split('.').map(function (k) {
            return getter(k);
          });
          source = chain.apply(null, traversals);
        }

        // source should be a function that takes the objDirty and returns
        // value or undefined
        value = source(objDirty);
      }

      // run source-agnostic transform on value
      // (e.g. make sure bytecode begins 0x)
      if (property.transform) {
        value = property.transform(value, objDirty);
      }

      // add resulting (possibly undefined) to normalized obj
      normalized[key] = value;
    });

    // Copy x- options
    Object.keys(objDirty).forEach(function (key) {
      if (key.indexOf('x-') === 0) {
        normalized[key] = getter(key)(objDirty);
      }
    });

    // update schema version
    normalized.schemaVersion = pkgVersion;

    if (options.validate) {
      this.validate(normalized);
    }

    return normalized;
  }
};

module.exports = TruffleContractSchema;
