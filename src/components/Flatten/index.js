const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const tsort = require('tsort');
const parser = require('@solidity-parser/parser');
const Config = require('../Config');
const Resolver = require('../Resolver');
const packageJson = require('../../../package.json');

const SPDX_LICENSES_REGEX = /^(?:\/\/|\/\*)\s*SPDX-License-Identifier:\s*([a-zA-Z\d+.-]+).*/gm;
const PRAGMA_DIRECTIVES_REGEX = /^(?: |\t)*(pragma\s*abicoder\s*v(1|2)|pragma\s*experimental\s*ABIEncoderV2)\s*;/gim;
const IMPORT_SOLIDITY_REGEX = /^\s*import(\s+)[\s\S]*?;\s*$/gm;

function unique(array) {
  return [...new Set(array)];
}

async function resolve(importPath) {
  const config = Config.detect({});
  const resolver = new Resolver(config);

  try {
    if (importPath === 'tronbox/console.sol') {
      const filePath = path.resolve(__dirname, '../../../console.sol');
      const fileContents = fs.readFileSync(filePath).toString();
      return { fileContents, filePath, packageInfo: { name: packageJson.name, version: packageJson.version } };
    }

    return await new Promise((resolve, reject) => {
      resolver.resolve(importPath, function (err, fileContents, filePath, _source, packageInfo) {
        if (err) {
          reject(err);
        } else {
          resolve({ fileContents, filePath, packageInfo });
        }
      });
    });
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

  const dependencies = getDependencies(resolved.filePath, resolved.fileContents).sort();

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

    throw e;
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

function fileNameToGlobalName(fileName, projectRoot) {
  let globalName = getFilePathsFromProjectRoot([fileName], projectRoot)[0];
  if (globalName.indexOf('node_modules/') !== -1) {
    globalName = globalName.substr(globalName.indexOf('node_modules/') + 'node_modules/'.length);
  }

  return globalName;
}

async function printContactenation(files, log) {
  const parts = files.map(({ file, content, packageInfo }) => {
    let normalizedText = getTextWithoutImports(content);
    normalizedText = commentOutLicenses(normalizedText);
    normalizedText = commentOutPragmaAbicoderDirectives(normalizedText);

    const fileLabel =
      packageInfo && packageInfo.name && packageInfo.version
        ? `// File npm/${packageInfo.name}@${packageInfo.version}/${file.substring(packageInfo.name.length + 1)}`
        : `// File ${file}`;

    return `\n\n${fileLabel}\n\n${normalizedText}\n`;
  });

  log(parts.join(''));
}

function getFilePathsFromProjectRoot(filePaths, projectRoot) {
  return filePaths.map(f => path.relative(projectRoot, path.resolve(f)));
}

function removeDuplicateAndSurroundingWhitespaces(str) {
  return str.replace(/\s+/g, ' ').trim();
}

function getLicensesInfo(files) {
  const licenses = new Set();
  const filesWithoutLicenses = new Set();

  for (const file of files) {
    const matches = [...file.content.matchAll(SPDX_LICENSES_REGEX)];

    if (matches.length === 0) {
      filesWithoutLicenses.add(file.file);
      continue;
    }

    for (const groups of matches) {
      licenses.add(groups[1]);
    }
  }

  return {
    licenses: Array.from(licenses).sort(),
    filesWithoutLicenses: Array.from(filesWithoutLicenses).sort()
  };
}

function getPragmaAbicoderDirectiveInfo(files) {
  let directive = '';
  const directivesByImportance = ['pragma abicoder v1', 'pragma experimental ABIEncoderV2', 'pragma abicoder v2'];
  const filesWithoutPragmaDirectives = new Set();
  const filesWithMostImportantDirective = {};

  for (const file of files) {
    const matches = [...file.content.matchAll(PRAGMA_DIRECTIVES_REGEX)];

    if (matches.length === 0) {
      filesWithoutPragmaDirectives.add(file.file);
      continue;
    }

    let fileMostImportantDirective = '';
    for (const groups of matches) {
      const normalizedPragma = removeDuplicateAndSurroundingWhitespaces(groups[1]);

      if (directivesByImportance.indexOf(normalizedPragma) > directivesByImportance.indexOf(directive)) {
        directive = normalizedPragma;
      }

      if (
        directivesByImportance.indexOf(normalizedPragma) > directivesByImportance.indexOf(fileMostImportantDirective)
      ) {
        fileMostImportantDirective = normalizedPragma;
      }
    }

    filesWithMostImportantDirective[file.file] = fileMostImportantDirective;
  }

  const filesWithDifferentPragmaDirectives = Object.entries(filesWithMostImportantDirective)
    .filter(([, fileDirective]) => fileDirective !== directive)
    .map(([fileName]) => fileName)
    .sort();

  return {
    pragmaDirective: directive,
    filesWithoutPragmaDirectives: Array.from(filesWithoutPragmaDirectives).sort(),
    filesWithDifferentPragmaDirectives
  };
}

function getLicensesHeader(licenses) {
  return licenses.length === 0 ? '' : `\n\n// SPDX-License-Identifier: ${licenses.join(' AND ')}`;
}

function getPragmaAbicoderDirectiveHeader(pragmaDirective) {
  return pragmaDirective === '' ? '' : `\n\n${pragmaDirective};`;
}

function getTextWithoutImports(fileContent) {
  return fileContent.replace(IMPORT_SOLIDITY_REGEX, '').trim();
}

function commentOutLicenses(fileContent) {
  return fileContent.replace(
    SPDX_LICENSES_REGEX,
    (...groups) => `// Original license: SPDX_License_Identifier: ${groups[1]}`
  );
}

function commentOutPragmaAbicoderDirectives(fileContent) {
  return fileContent.replace(PRAGMA_DIRECTIVES_REGEX, (...groups) => {
    return `// Original pragma directive: ${removeDuplicateAndSurroundingWhitespaces(groups[1])}`;
  });
}

const Flatten = {
  run: function (filePaths, callback) {
    const projectRoot = process.cwd();
    const filePathsFromProjectRoot = getFilePathsFromProjectRoot(filePaths, projectRoot);

    let res = `// Sources flattened with TronBox v${packageJson.version} ${packageJson.homepage}`;
    getSortedFilePaths(filePathsFromProjectRoot, projectRoot)
      .then(async sortedFiles => {
        const fileContents = await Promise.all(
          sortedFiles.map(async file => {
            const resolved = await resolve(file);
            return {
              file,
              content: resolved.fileContents,
              packageInfo: resolved.packageInfo
            };
          })
        );

        const { licenses, filesWithoutLicenses } = getLicensesInfo(fileContents);
        const { pragmaDirective, filesWithoutPragmaDirectives, filesWithDifferentPragmaDirectives } =
          getPragmaAbicoderDirectiveInfo(fileContents);

        res += getLicensesHeader(licenses);
        res += getPragmaAbicoderDirectiveHeader(pragmaDirective);

        printContactenation(fileContents, str => (res += str))
          .then(() => {
            process.stdout.write(res);

            if (filesWithoutLicenses.length > 0) {
              console.warn(
                chalk.yellow(`\nThe following file(s) do NOT specify SPDX licenses: ${filesWithoutLicenses.join(', ')}`)
              );
            }

            if (pragmaDirective !== '' && filesWithoutPragmaDirectives.length > 0) {
              console.warn(
                chalk.yellow(
                  `\nPragma abicoder directives are defined in some files, but they are not defined in the following ones: ${filesWithoutPragmaDirectives.join(
                    ', '
                  )}`
                )
              );
            }

            if (filesWithDifferentPragmaDirectives.length > 0) {
              console.warn(
                chalk.yellow(
                  `\nThe flattened file is using the pragma abicoder directive '${pragmaDirective}' but these files have a different pragma abicoder directive: ${filesWithDifferentPragmaDirectives.join(
                    ', '
                  )}`
                )
              );
            }

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
