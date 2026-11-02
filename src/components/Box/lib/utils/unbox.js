const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const axios = require('axios');
const { spawnSync } = require('child_process');
const ghdownload = require('./download');

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
    const [repoPart, ref = 'master'] = url.split('#');
    const parts = repoPart.replace(/\.git$/, '').split(/[:/]/);
    const user = parts[parts.length - 2];
    const repo = parts[parts.length - 1];
    const targetUrl = `https://raw.githubusercontent.com/${user}/${repo}/${ref}/tronbox.js`;

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
  return fs.mkdtempSync(path.join(os.tmpdir(), 'tronbox-box-'));
}

function fetchRepository(url, dir) {
  return ghdownload(url, dir);
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
  const workingDirectoryPath = path.resolve(destination);

  // remove box config file
  needingRemoval.push('tronbox.json');
  needingRemoval.push('tronbox-init.json');
  needingRemoval.push('post-unpack.sh');

  const promises = needingRemoval
    .map(function (file_path) {
      return path.join(destination, file_path);
    })
    .map(function (file_path) {
      return new Promise(function (accept, reject) {
        const resolvedPath = path.resolve(workingDirectoryPath, file_path);
        const relative = path.relative(workingDirectoryPath, resolvedPath);
        if (relative.startsWith('..') || path.isAbsolute(relative)) {
          return accept();
        }

        fs.remove(resolvedPath, function (err) {
          if (err) return reject(err);
          accept();
        });
      });
    });

  return Promise.all(promises);
}

function installBoxDependencies(_boxConfig, destination) {
  return new Promise(function (accept, reject) {
    const packageJsonPath = path.join(destination, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return accept();
    }

    const result = spawnSync('npm', ['install', '--ignore-scripts'], {
      cwd: destination,
      stdio: 'ignore',
      shell: true,
      // Prevent cmd.exe from finding npm in the unpacked box directory.
      env: { ...process.env, NoDefaultCurrentDirectoryInExePath: '1' }
    });
    if (result.error) {
      return reject(result.error);
    }

    if (result.status !== 0) {
      return reject(new Error('Failed to install box dependencies using npm install'));
    }

    accept();
  });
}

module.exports = {
  checkDestination,
  verifyURL,
  setupTempDirectory,
  fetchRepository,
  copyTempIntoDestination,
  readBoxConfig,
  cleanupUnpack,
  installBoxDependencies
};
