const unbox = require('./unbox');

module.exports = {
  downloadBox: function (url, destination) {
    let tmpDir;
    let tmpCleanup;

    return Promise.resolve()
      .then(function () {
        return unbox.checkDestination(destination);
      })
      .then(function () {
        return unbox.verifyURL(url);
      })
      .then(function () {
        return unbox.setupTempDirectory();
      })
      .then(function ({ dir, cleanupCallback }) {
        // save tmpDir result
        tmpDir = dir;
        tmpCleanup = cleanupCallback;
      })
      .then(function () {
        return unbox.fetchRepository(url, tmpDir);
      })
      .then(function () {
        return unbox.copyTempIntoDestination(tmpDir, destination);
      })
      .then(tmpCleanup)
      .catch(error => {
        if (tmpCleanup) tmpCleanup();
        throw error;
      });
  },

  unpackBox: function (destination) {
    let boxConfig;

    return Promise.resolve()
      .then(function () {
        return unbox.readBoxConfig(destination);
      })
      .then(function (cfg) {
        boxConfig = cfg;
      })
      .then(function () {
        return unbox.cleanupUnpack(boxConfig, destination);
      })
      .then(function () {
        return boxConfig;
      });
  },

  setupBox: function (boxConfig, destination) {
    return Promise.resolve()
      .then(function () {
        return unbox.installBoxDependencies(boxConfig, destination);
      })
      .then(function () {
        return boxConfig;
      });
  }
};
