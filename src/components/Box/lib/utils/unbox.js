const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const vcsurl = require('vcsurl');
const tmp = require('tmp');
const exec = require('child_process').exec;
const ghdownload = require('./download');
const cwd = process.cwd();

const config = require('../config');

function checkDestination(destination) {
  return Promise.resolve().then(function () {
    const contents = fs.readdirSync(destination);
    if (contents.length) {
      const err =
        'Something already exists at the destination. ' +
        '`tronbox init` and `tronbox unbox` must be executed in an empty folder. ' +
        'Stopping to prevent overwriting data.';

      throw new Error(err);
    }
  });
}

function verifyURL(url) {
  // Next let's see if the expected repository exists. If it doesn't, ghdownload
  // will fail spectacularly in a way we can't catch, so we have to do it ourselves.
  return new Promise(function (accept, reject) {
    const configURL = new URL(
      vcsurl(url).replace('github.com', 'raw.githubusercontent.com').replace(/#.*/, '') + '/master/tronbox.js'
    );

    const targetUrl = 'https://' + configURL.host + configURL.pathname;

    axios
      .head(targetUrl)
      .then(() => accept())
      .catch(error => {
        if (error.response && error.response.status === 404) {
          return reject(
            new Error(
              'TronBox Box at URL ' +
                url +
                " doesn't exist. If you believe this is an error, please contact TronBox support."
            )
          );
        } else {
          return reject(
            new Error('Error connecting to github.com. Please check your internet connection and try again.')
          );
        }
      });
  });
}

function setupTempDirectory() {
  return new Promise(function (accept, reject) {
    tmp.dir({ dir: cwd, unsafeCleanup: true }, function (err, dir, cleanupCallback) {
      if (err) return reject(err);

      accept(path.join(dir, 'box'), cleanupCallback);
    });
  });
}

function fetchRepository(url, dir) {
  return new Promise(function (accept, reject) {
    // Download the package from github.
    ghdownload(url, dir)
      .on('err', function (err) {
        reject(err);
      })
      .on('end', function () {
        accept();
      });
  });
}

function copyTempIntoDestination(tmpDir, destination) {
  return new Promise(function (accept, reject) {
    fs.copy(tmpDir, destination, function (err) {
      if (err) return reject(err);
      accept();
    });
  });
}

function readBoxConfig(destination) {
  const possibleConfigs = [path.join(destination, 'tronbox.json'), path.join(destination, 'tronbox-init.json')];

  const configPath = possibleConfigs.reduce(function (path, alt) {
    return path || (fs.existsSync(alt) && alt);
  }, undefined);

  return config.read(configPath);
}

function cleanupUnpack(boxConfig, destination) {
  const needingRemoval = boxConfig.ignore || [];

  // remove box config file
  needingRemoval.push('tronbox.json');
  needingRemoval.push('tronbox-init.json');

  const promises = needingRemoval
    .map(function (file_path) {
      return path.join(destination, file_path);
    })
    .map(function (file_path) {
      return new Promise(function (accept, reject) {
        fs.remove(file_path, function (err) {
          if (err) return reject(err);
          accept();
        });
      });
    });

  return Promise.all(promises);
}

function installBoxDependencies(boxConfig, destination) {
  const postUnpack = boxConfig.hooks['post-unpack'];

  return new Promise(function (accept, reject) {
    if (postUnpack.length === 0) {
      return accept();
    }

    exec(postUnpack, { cwd: destination }, function (err, stdout, stderr) {
      if (err) return reject(err);
      accept(stdout, stderr);
    });
  });
}

module.exports = {
  checkDestination: checkDestination,
  verifyURL: verifyURL,
  setupTempDirectory: setupTempDirectory,
  fetchRepository: fetchRepository,
  copyTempIntoDestination: copyTempIntoDestination,
  readBoxConfig: readBoxConfig,
  cleanupUnpack: cleanupUnpack,
  installBoxDependencies: installBoxDependencies
};
