const EPMSource = require('./epm');
const NPMSource = require('./npm');
const FSSource = require('./fs');
const whilst = require('async/whilst');
const contract = require('../Contract');
const expect = require('@truffle/expect');
const provision = require('../Provisioner');

function Resolver(options) {
  expect.options(options, ['working_directory', 'contracts_build_directory']);

  this.options = options;

  this.sources = [
    new EPMSource(options.working_directory, options.contracts_build_directory),
    new NPMSource(options.working_directory),
    new NPMSource(__dirname),
    new FSSource(options.working_directory, options.contracts_build_directory)
  ];
}

// This function might be doing too much. If so, too bad (for now).
Resolver.prototype.require = function (import_path, search_path) {
  const self = this;

  for (let i = 0; i < this.sources.length; i++) {
    const source = this.sources[i];
    const result = source.require(import_path, search_path);
    if (result) {
      const abstraction = contract(result);
      provision(abstraction, self.options);
      return abstraction;
    }
  }
  throw new Error('Could not find artifacts for ' + import_path + ' from any sources');
};

Resolver.prototype.resolve = function (import_path, imported_from, callback) {
  const self = this;

  if (typeof imported_from === 'function') {
    callback = imported_from;
    imported_from = null;
  }

  let resolved_body = null;
  let resolved_path = null;
  let current_index = -1;
  let current_source;

  whilst(
    function () {
      return !resolved_body && current_index < self.sources.length - 1;
    },
    function (next) {
      current_index += 1;
      current_source = self.sources[current_index];

      current_source.resolve(import_path, imported_from, function (err, body, file_path) {
        if (!err && body) {
          resolved_body = body;
          resolved_path = file_path;
        }
        next(err);
      });
    },
    function (err) {
      if (err) return callback(err);

      if (!resolved_body) {
        let message = 'Could not find ' + import_path + ' from any sources';

        if (imported_from) {
          message += '; imported from ' + imported_from;
        }

        return callback(new Error(message));
      }

      callback(null, resolved_body, resolved_path, current_source);
    }
  );
};

module.exports = Resolver;
