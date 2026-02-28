const path = require('path');
const fs = require('fs');

// Extract npm package name from an import path.
// Scoped:   "@openzeppelin/contracts/token/ERC20.sol" → "@openzeppelin/contracts"
// Unscoped: "solmate/src/tokens/ERC20.sol"            → "solmate"
function getPackageName(importPath) {
  const parts = importPath.split('/');
  return importPath.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

function NPM(working_directory) {
  this.working_directory = working_directory;
}

NPM.prototype.require = function (import_path, search_path) {
  if (import_path.indexOf('.') === 0 || import_path.indexOf('/') === 0) {
    return null;
  }
  const contract_name = path.basename(import_path, '.sol');
  const regex = new RegExp(`(.*)/${contract_name}`);
  let package_name = '';
  const matched = regex.exec(import_path);
  if (matched) {
    package_name = matched[1];
  }
  const expected_path = path.join(
    search_path || this.working_directory,
    'node_modules',
    package_name,
    'build',
    'contracts',
    contract_name + '.json'
  );
  try {
    const result = fs.readFileSync(expected_path, 'utf8');
    return JSON.parse(result);
  } catch (e) {
    return null;
  }
};

NPM.prototype.resolve = function (import_path, imported_from, callback) {
  // If nothing's found, body returns `undefined`
  let body;
  let packageInfo = {};
  let modulesDir = this.working_directory;

  while (true) {
    const expected_path = path.join(modulesDir, 'node_modules', import_path);

    try {
      body = fs.readFileSync(expected_path, { encoding: 'utf8' });

      const packageName = getPackageName(import_path);
      const pkgJsonPath = path.join(modulesDir, 'node_modules', packageName, 'package.json');
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, { encoding: 'utf8' }));
        packageInfo = { name: pkg.name, version: pkg.version };
      } catch (e) {}

      break;
    } catch (e) {}

    // Recurse outwards until impossible
    const oldModulesDir = modulesDir;
    modulesDir = path.join(modulesDir, '..');
    if (modulesDir === oldModulesDir) {
      break;
    }
  }

  return callback(null, body, import_path, packageInfo);
};

// We're resolving package paths to other package paths, not absolute paths.
// This will ensure the source fetcher conintues to use the correct sources for packages.
// i.e., if some_module/contracts/MyContract.sol imported "./AnotherContract.sol",
// we're going to resolve it to some_module/contracts/AnotherContract.sol, ensuring
// that when this path is evaluated this source is used again.
NPM.prototype.resolve_dependency_path = function (import_path, dependency_path) {
  const dirname = path.dirname(import_path);
  return path.join(dirname, dependency_path);
};

NPM.prototype.provision_contracts = function (callback) {
  // TODO: Fill this out!
  callback(null, {});
};

module.exports = NPM;
