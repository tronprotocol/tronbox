function TestSource(config) {
  this.config = config;
}

TestSource.prototype.require = function () {
  return null; // FSSource will get it.
};

TestSource.prototype.resolve = function (_import_path, callback) {
  return callback();
};

TestSource.prototype.resolve_dependency_path = function (_import_path, dependency_path) {
  return dependency_path;
};

module.exports = TestSource;
