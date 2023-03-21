const OS = require('os');
const dir = require('node-dir');
const path = require('path');
const async = require('async');
const debug = require('debug')('lib:debug');

const commandReference = {
  o: 'step over',
  i: 'step into',
  u: 'step out',
  n: 'step next',
  ';': 'step instruction',
  p: 'print instruction',
  h: 'print this help',
  v: 'print variables and values',
  ':': 'evaluate expression - see `v`',
  '+': 'add watch expression (`+:<expr>`)',
  '-': 'remove watch expression (-:<expr>)',
  '?': 'list existing watch expressions',
  b: 'toggle breakpoint',
  c: 'continue until breakpoint',
  q: 'quit'
};

const DebugUtils = {
  gatherArtifacts: function (config) {
    return new Promise((accept, reject) => {
      // Gather all available contract artifacts
      dir.files(config.contracts_build_directory, (err, files) => {
        if (err) return reject(err);

        const contracts = files
          .filter(file_path => {
            return path.extname(file_path) === '.json';
          })
          .map(file_path => {
            return path.basename(file_path, '.json');
          })
          .map(contract_name => {
            return config.resolver.require(contract_name);
          });

        async.each(
          contracts,
          (abstraction, finished) => {
            finished();
          },
          err => {
            if (err) return reject(err);
            accept(
              contracts.map(contract => {
                debug('contract.sourcePath: %o', contract.sourcePath);

                return {
                  contractName: contract.contractName,
                  source: contract.source,
                  sourceMap: contract.sourceMap,
                  sourcePath: contract.sourcePath,
                  binary: contract.binary,
                  ast: contract.ast,
                  deployedBinary: contract.deployedBinary,
                  deployedSourceMap: contract.deployedSourceMap
                };
              })
            );
          }
        );
      });
    });
  },

  formatStartMessage: function () {
    const lines = ['', 'Gathering transaction data...', ''];

    return lines.join(OS.EOL);
  },

  formatCommandDescription: function (commandId) {
    return '(' + commandId + ') ' + commandReference[commandId];
  },

  formatAffectedInstances: function (instances) {
    let hasAllSource = true;

    const lines = Object.keys(instances).map(function (address) {
      const instance = instances[address];

      if (instance.contractName) {
        return ' ' + address + ' - ' + instance.contractName;
      }

      if (!instance.source) {
        hasAllSource = false;
      }

      return ' ' + address + '(UNKNOWN)';
    });

    if (!hasAllSource) {
      lines.push('');
      lines.push('Warning: The source code for one or more contracts could not be found.');
    }

    return lines.join(OS.EOL);
  },

  formatHelp: function (lastCommand) {
    if (!lastCommand) {
      lastCommand = 'n';
    }

    const prefix = ['Commands:', '(enter) last command entered (' + commandReference[lastCommand] + ')'];

    const commandSections = [['o', 'i', 'u', 'n'], [';', 'p', 'h', 'q'], ['b', 'c'], ['+', '-'], ['?'], ['v', ':']].map(
      function (shortcuts) {
        return shortcuts.map(DebugUtils.formatCommandDescription).join(', ');
      }
    );

    const suffix = [''];

    const lines = prefix.concat(commandSections).concat(suffix);

    return lines.join(OS.EOL);
  },

  formatLineNumberPrefix: function (line, number, cols, tab) {
    if (!tab) {
      tab = '  ';
    }

    let prefix = number + '';
    while (prefix.length < cols) {
      prefix = ' ' + prefix;
    }

    prefix += ': ';
    return prefix + line.replace(/\t/g, tab);
  },

  formatLinePointer: function (line, startCol, endCol, padding, tab) {
    if (!tab) {
      tab = '  ';
    }

    padding += 2; // account for ": "
    let prefix = '';
    while (prefix.length < padding) {
      prefix += ' ';
    }

    let output = '';
    for (let i = 0; i < line.length; i++) {
      const pointedAt = i >= startCol && i < endCol;
      const isTab = line[i] === '\t';

      let additional;
      if (isTab) {
        additional = tab;
      } else {
        additional = ' '; // just a space
      }

      if (pointedAt) {
        additional = additional.replace(/./g, '^');
      }

      output += additional;
    }

    return prefix + output;
  },

  formatRangeLines: function (source, range, contextBefore) {
    if (!contextBefore) {
      contextBefore = 2;
    }

    const startBeforeIndex = Math.max(range.start.line - contextBefore, 0);

    const prefixLength = (range.start.line + 1 + '').length;

    const beforeLines = source
      .filter(function (line, index) {
        return index >= startBeforeIndex && index < range.start.line;
      })
      .map(function (line, index) {
        const number = startBeforeIndex + index + 1; // 1 to account for 0-index
        return DebugUtils.formatLineNumberPrefix(line, number, prefixLength);
      });

    const line = source[range.start.line];
    const number = range.start.line + 1; // zero-index

    const pointerStart = range.start.column;
    let pointerEnd;

    // range.end is undefined in some cases
    // null/undefined check to avoid exceptions
    if (range.end && range.start.line === range.end.line) {
      // start and end are same line: pointer ends at column
      pointerEnd = range.end.column;
    } else {
      pointerEnd = line.length;
    }

    const allLines = beforeLines.concat([
      DebugUtils.formatLineNumberPrefix(line, number, prefixLength),
      DebugUtils.formatLinePointer(line, pointerStart, pointerEnd, prefixLength)
    ]);

    return allLines.join(OS.EOL);
  },

  formatInstruction: function (traceIndex, instruction) {
    return '(' + traceIndex + ') ' + instruction.name + ' ' + (instruction.pushData || '');
  },

  formatStack: function (stack) {
    const formatted = stack.map(function (item, index) {
      item = '  ' + item;
      if (index === stack.length - 1) {
        item += ' (top)';
      }

      return item;
    });

    if (!stack.length) {
      formatted.push('  No data on stack.');
    }

    return formatted.join(OS.EOL);
  }
};

module.exports = DebugUtils;
