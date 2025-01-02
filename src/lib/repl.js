const repl = require('repl');
const expect = require('@truffle/expect');
const async = require('async');
const EventEmitter = require('events');
const inherits = require('util').inherits;
const TronWrap = require('../components/TronWrap');

inherits(ReplManager, EventEmitter);

function ReplManager(options) {
  EventEmitter.call(this);

  expect.options(options, [
    'working_directory',
    'contracts_directory',
    'contracts_build_directory',
    'migrations_directory',
    'network',
    'network_id',
    'provider',
    'resolver',
    'build_directory'
  ]);

  this.options = options;
  this.repl = options.repl;

  this.contexts = [];
}

ReplManager.prototype.start = function (options) {
  const self = this;

  global.tronWeb = TronWrap();

  this.contexts.push({
    prompt: options.prompt,
    interpreter: options.interpreter,
    done: options.done
  });

  const currentContext = this.contexts[this.contexts.length - 1];

  if (!this.repl) {
    this.repl = repl.start({
      prompt: currentContext.prompt,
      eval: this.interpret.bind(this)
    });

    this.repl.on('exit', function () {
      // If we exit for some reason, call done functions for good measure
      // then ensure the process is completely killed. Once the repl exits,
      // the process is in a bad state and can't be recovered (e.g., stdin is closed).
      const doneFunctions = self.contexts.map(function (context) {
        return context.done
          ? function () {
              context.done();
            }
          : function () {};
      });
      async.series(doneFunctions, function () {
        process.exit();
      });
    });
  }

  // Bubble the internal repl's exit event
  this.repl.on('exit', function () {
    self.emit('exit');
  });

  this.repl.setPrompt(options.prompt);
  this.setContextVars(options.context || {});
};

ReplManager.prototype.setContextVars = function (obj) {
  const self = this;
  if (this.repl) {
    Object.keys(obj).forEach(function (key) {
      self.repl.context[key] = obj[key];
    });
  }
};

ReplManager.prototype.stop = function (callback) {
  const oldContext = this.contexts.pop();

  if (oldContext.done) {
    oldContext.done();
  }

  const currentContext = this.contexts[this.contexts.length - 1];

  if (currentContext) {
    this.repl.setPrompt(currentContext.prompt);
  } else {
    // If there's no new context, stop the process altogether.
    // Though this might seem like an out of place process.exit(),
    // once the Node repl closes, the state of the process is not
    // recoverable; e.g., stdin is closed and can't be reopened.
    // Since we can't recover to a state before the repl was opened,
    // we should just exit. He're, we'll exit after we've popped
    // off the stack of all repl contexts.
    process.exit();
  }

  if (callback) {
    callback();
  }
};

ReplManager.prototype.interpret = function (cmd, context, filename, callback) {
  const currentContext = this.contexts[this.contexts.length - 1];
  currentContext.interpreter(cmd, context, filename, callback);
};

module.exports = ReplManager;
