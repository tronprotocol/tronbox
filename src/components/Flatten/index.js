const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const tsort = require('tsort');
const parser = require('@solidity-parser/parser');
const Resolver = require('@resolver-engine/imports-fs').ImportsFsEngine;
const packageJson = require('../../../package.json');

const IMPORT_SOLIDITY_REGEX = /^\s*import(\s+)[\s\S]*?;\s*$/gm;

function unique(array) {
  return [...new Set(array)];
}

async function resolve(importPath) {
  const resolver = Resolver();
  try {
    if (importPath === 'tronbox/console.sol') {
      const filePath = path.resolve(__dirname, '../../../console.sol');
      const fileContents = fs.readFileSync(filePath).toString();
      return { fileContents, filePath };
    }

    const filePath = await resolver.resolve(importPath);
    const fileContents = fs.readFileSync(filePath).toString();
    return { fileContents, filePath };
  } catch (error) {
    throw new Error('File ' + importPath + " doesn't exist or is not a readable file.");
  }
}

function getDirPath(filePath) {
  const index1 = filePath.lastIndexOf(path.sep);
  const index2 = filePath.lastIndexOf('/');
  return filePath.substring(0, Math.max(index1, index2));
}

function getDependencies(filePath, fileContents) {
  try {
    const ast = parser.parse(fileContents);
    const imports = [];
    parser.visit(ast, {
      ImportDirective: function (node) {
        imports.push(getNormalizedDependencyPath(node.path, filePath));
      }
    });
    return imports;
  } catch (error) {
    throw new Error('Could not parse ' + filePath + ' for extracting its imports: ' + error);
  }
}

function getNormalizedDependencyPath(dependency, filePath) {
  if (dependency.startsWith('./') || dependency.startsWith('../')) {
    dependency = path.join(getDirPath(filePath), dependency);
    dependency = path.normalize(dependency);
  }

  return dependency.replace(/\\/g, '/');
}

async function dependenciesDfs(graph, visitedFiles, filePath) {
  visitedFiles.push(filePath);

  const resolved = await resolve(filePath);

  const dependencies = getDependencies(resolved.filePath, resolved.fileContents);

  for (const dependency of dependencies) {
    graph.add(dependency, filePath);

    if (!visitedFiles.includes(dependency)) {
      await dependenciesDfs(graph, visitedFiles, dependency);
    }
  }
}

async function getSortedFilePaths(entryPoints, projectRoot) {
  const graph = tsort();
  const visitedFiles = [];

  for (const entryPoint of entryPoints) {
    await dependenciesDfs(graph, visitedFiles, entryPoint);
  }

  let topologicalSortedFiles;
  try {
    topologicalSortedFiles = graph.sort();
  } catch (e) {
    if (e.toString().includes('Error: There is a cycle in the graph.')) {
      const message =
        'There is a cycle in the dependency' +
        " graph, can't compute topological ordering. Files:\n\t" +
        visitedFiles.join('\n\t');
      throw new Error(message);
    }
  }

  // If an entry has no dependency it won't be included in the graph, so we
  // add them and then dedup the array
  const withEntries = topologicalSortedFiles.concat(entryPoints).map(f => {
    // Remove the prefix node modules.
    const fileName = fileNameToGlobalName(f, projectRoot);
    if (fileName.substring(0, 14) === 'node_modules\\@') {
      return fileName.substring(13);
    } else {
      return fileName;
    }
  });

  const files = unique(withEntries);

  return files;
}

async function fileContentWithoutImports(filePath) {
  const resolved = await resolve(filePath);
  const output = resolved.fileContents.replace(IMPORT_SOLIDITY_REGEX, '');

  // normalize whitespace to a single trailing newline
  return output.trim() + '\n';
}

function fileNameToGlobalName(fileName, projectRoot) {
  let globalName = getFilePathsFromProjectRoot([fileName], projectRoot)[0];
  if (globalName.indexOf('node_modules/') !== -1) {
    globalName = globalName.substr(globalName.indexOf('node_modules/') + 'node_modules/'.length);
  }

  return globalName;
}

async function printContactenation(files, log) {
  const parts = await Promise.all(
    files.map(async file => {
      return '// File: ' + file + '\n\n' + (await fileContentWithoutImports(file));
    })
  );

  // add a single empty line between parts
  log(parts.join('\n'));
}

function getFilePathsFromProjectRoot(filePaths, projectRoot) {
  return filePaths.map(f => path.relative(projectRoot, path.resolve(f)));
}

const Flatten = {
  run: function (filePaths, callback) {
    const projectRoot = process.cwd();
    const filePathsFromProjectRoot = getFilePathsFromProjectRoot(filePaths, projectRoot);

    let res = `// Sources flattened with tronbox v${packageJson.version} ${packageJson.homepage}\n\n`;
    getSortedFilePaths(filePathsFromProjectRoot, projectRoot)
      .then(sortedFiles => {
        printContactenation(sortedFiles, str => (res += str))
          .then(() => {
            process.stdout.write(res);
            callback();
          })
          .catch(e => {
            console.error(chalk.red(chalk.bold('ERROR:'), e.message ? e.message : e));
            callback();
          });
      })
      .catch(e => {
        console.error(chalk.red(chalk.bold('ERROR:'), e.message ? e.message : e));
        callback();
      });
  }
};

module.exports = Flatten;
