/**
 * Portions of this code are derived from node-github-download
 * Copyright (c) 2013 JP Richardson
 * Licensed under the MIT License
 * Original source: https://github.com/jprichardson/node-github-download
 *
 * Modified for TronBox:
 * - Replaced 'request' library with 'axios' for HTTP requests
 * - Updated to use modern JavaScript patterns
 * - Modified ZIP handling to use 'yauzl' instead of 'adm-zip'
 */

const EventEmitter = require('events').EventEmitter;
const vcsurl = require('vcsurl');
const axios = require('axios');
const path = require('path');
const fs = require('fs-extra');
const util = require('util');

const cwd = process.cwd();

function GithubDownloader(user, repo, ref, dir) {
  this.user = user;
  this.repo = repo;
  this.ref = ref || 'master';
  this.dir = dir;
  this._log = [];
  this._getZip = false;
}
util.inherits(GithubDownloader, EventEmitter);

GithubDownloader.prototype.start = function () {
  const _this = this;
  const initialUrl = 'https://api.github.com/repos/' + this.user + '/' + this.repo + '/contents/';
  const initialUrlRef = this.ref ? '?ref=' + this.ref : '';
  const rawUrl = 'https://raw.github.com/' + this.user + '/' + this.repo + '/' + this.ref + '/';
  let pending = 0;
  let gonnaProcess = 0;

  gonnaProcess += 1;
  requestJSON.call(this, initialUrl + initialUrlRef, processItems);

  function processItems(items) {
    pending += items.length;
    gonnaProcess -= 1;
    items.forEach(handleItem);
    checkDone();
  }

  function handleItem(item) {
    if (item.type === 'dir') {
      const dir = path.join(_this.dir, item.path);
      fs.mkdirs(dir, function (err) {
        if (err) _this.emit('error', err);
        _this._log.push(dir);
        gonnaProcess += 1;
        requestJSON.call(_this, initialUrl + item.path + initialUrlRef, processItems);
        _this.emit('dir', item.path);
        pending -= 1;
        checkDone();
      });
    } else if (item.type === 'file') {
      const file = path.join(_this.dir, item.path);
      fs.createFile(file, function (err) {
        if (err) _this.emit('error', err);
        axios
          .get(rawUrl + item.path, { responseType: 'stream' })
          .then(response => {
            response.data.pipe(fs.createWriteStream(file)).on('close', function () {
              _this._log.push(file);
              _this.emit('file', item.path);
              pending -= 1;
              checkDone();
            });
          })
          .catch(err => _this.emit('error', err));
      });
    } else {
      _this.emit('Error', new Error(JSON.stringify(item, null, 2) + '\n does not have type.'));
    }
  }

  function checkDone() {
    if (pending === 0 && gonnaProcess === 0 && !_this._getZip) {
      _this.emit('end');
    }
  }

  return this;
};

module.exports = function GithubDownload(params, dir) {
  if (typeof params === 'string') {
    const pieces = params.split('#');
    const ref = pieces[1];
    const url = (vcsurl(pieces[0]) || pieces[0]).split('/');
    params = { user: url[url.length - 2], repo: url[url.length - 1], ref: ref };
  }

  if (typeof params !== 'object') {
    throw new Error('Invalid parameter type. Should be repo URL string or object containing repo and user.');
  }

  dir = dir || process.cwd();
  const gh = new GithubDownloader(params.user, params.repo, params.ref, dir);
  return gh.start();
};

// PRIVATE METHODS

function requestJSON(url, callback) {
  const _this = this;
  axios
    .get(url)
    .then(response => {
      callback(response.data);
    })
    .catch(err => {
      if (err.response && err.response.status === 403) {
        return downloadZip.call(_this);
      }
      if (err.response && err.response.status !== 200) {
        _this.emit('error', new Error(url + ': returned ' + err.response.status + '\n\nbody:\n' + err.response.data));
      } else {
        _this.emit('error', err);
      }
    });
}

function extractZip(zipFile, outputDir, callback) {
  const yauzl = require('yauzl');
  const _this = this;

  yauzl.open(zipFile, { lazyEntries: true }, (err, zipfile) => {
    if (err) return _this.emit('error', err);

    let folderName = null;
    let pending = 0;

    zipfile.on('entry', entry => {
      if (!folderName && entry.fileName.includes('/')) {
        folderName = entry.fileName.split('/')[0];
      }

      if (/\/$/.test(entry.fileName)) {
        // Directory entry
        zipfile.readEntry();
      } else {
        // File entry
        pending++;
        zipfile.openReadStream(entry, (err, readStream) => {
          if (err) return _this.emit('error', err);

          const file = path.resolve(outputDir, entry.fileName);
          fs.ensureDir(path.dirname(file), err => {
            if (err) return _this.emit('error', err);

            const writeStream = fs.createWriteStream(file);
            readStream.pipe(writeStream);

            writeStream.on('close', () => {
              pending--;
              if (pending === 0) {
                callback(folderName || path.basename(zipFile, '.zip'));
              }
            });

            writeStream.on('error', err => _this.emit('error', err));
          });
        });
        zipfile.readEntry();
      }
    });

    zipfile.on('end', () => {
      if (pending === 0) {
        callback(folderName || path.basename(zipFile, '.zip'));
      }
    });

    zipfile.readEntry();
  });
}

function downloadZip() {
  const _this = this;
  if (_this._getZip) return;
  _this._getZip = true;

  _this._log.forEach(function (file) {
    fs.remove(file);
  });

  const tmpdir = generateTempDir();
  const zipBaseDir = _this.repo + '-' + _this.ref;
  const zipFile = path.join(tmpdir, zipBaseDir + '.zip');

  const zipUrl = 'https://github.com/' + _this.user + '/' + _this.repo + '/archive/' + _this.ref + '.zip';
  _this.emit('zip', zipUrl);

  fs.mkdir(tmpdir, function (err) {
    if (err) _this.emit('error', err);
    axios
      .get(zipUrl, { responseType: 'stream' })
      .then(response => {
        response.data.pipe(fs.createWriteStream(zipFile)).on('close', function () {
          extractZip.call(_this, zipFile, tmpdir, function (extractedFolderName) {
            const oldPath = path.join(tmpdir, extractedFolderName);
            fs.rename(oldPath, _this.dir, function (err) {
              if (err) _this.emit('error', err);
              fs.remove(tmpdir, function (err) {
                if (err) _this.emit('error', err);
                _this.emit('end');
              });
            });
          });
        });
      })
      .catch(err => _this.emit('error', err));
  });
}

function generateTempDir() {
  return path.join(cwd, Date.now().toString() + '-' + Math.random().toString().substring(2));
}
