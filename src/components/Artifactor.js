const Schema = require('./ContractSchema');
const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');

function Artifactor(destination) {
  this.destination = destination;
}

Artifactor.prototype.save = function (object, options) {
  const self = this;

  return new Promise(function (accept, reject) {
    object = Schema.normalize(object);

    Object.values(object.networks).forEach(_ => (_.address = _.address.toLowerCase().replace(/^0x/, '41')));

    if (options.evm) {
      Object.values(object.networks).forEach(_ => (_.address = _.address.toLowerCase().replace(/^41/, '0x')));
    }

    if (!object.contractName) {
      return reject(new Error('You must specify a contract name.'));
    }

    let output_path = object.contractName;

    // Create new path off of destination.
    output_path = path.join(self.destination, output_path);
    output_path = path.resolve(output_path);

    // Add json extension.
    output_path = output_path + '.json';

    fs.readFile(output_path, { encoding: 'utf8' }, function (err, json) {
      // No need to handle the error. If the file doesn't exist then we'll start afresh
      // with a new object.

      let finalObject = object;

      if (!err) {
        let existingObjDirty;
        try {
          existingObjDirty = JSON.parse(json);
        } catch (e) {
          reject(e);
        }

        // normalize existing and merge into final
        finalObject = Schema.normalize(existingObjDirty);

        // merge networks
        const finalNetworks = {};
        _.merge(finalNetworks, finalObject.networks, object.networks);

        // update existing with new
        _.assign(finalObject, object);
        finalObject.networks = finalNetworks;
      }

      // update timestamp
      finalObject.updatedAt = new Date().toISOString();

      // output object
      fs.outputFile(output_path, JSON.stringify(finalObject, null, 2), 'utf8', function (err) {
        if (err) return reject(err);
        accept();
      });
    });
  });
};

Artifactor.prototype.saveAll = function (objects, options) {
  const self = this;

  if (Array.isArray(objects)) {
    const array = objects;
    objects = {};

    array.forEach(function (item) {
      objects[item.contract_name] = item;
    });
  }

  return new Promise(function (accept, reject) {
    fs.stat(self.destination, function (err) {
      if (err) {
        return reject(new Error('Destination ' + self.destination + " doesn't exist!"));
      }
      accept();
    });
  }).then(function () {
    const promises = [];

    Object.keys(objects).forEach(function (contractName) {
      const object = objects[contractName];
      object.contractName = contractName;
      promises.push(self.save(object, options));
    });

    return Promise.all(promises);
  });
};

module.exports = Artifactor;
