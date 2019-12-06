const fs = require('fs')
const path = require('path')
const Module = require('module')
const vm = require('vm')
const originalrequire = require('original-require')
const expect = require('@truffle/expect')
const Config = require('./Config')

// options.file: path to file to execute. Must be a module that exports a function.
// options.args: arguments passed to the exported function within file. If a callback
//   is not included in args, exported function is treated as synchronous.
// options.context: Object containing any global variables you'd like set when this
//   function is run.
const Require = {
  file: options => {

    const file = options.file

    expect.options(options, ['file'])

    options = Config.default().with(options)

    const source = fs.readFileSync(options.file, {encoding: 'utf8'})

    // Modified from here: https://gist.github.com/anatoliychakkaev/1599423
    const m = new Module(file)

    // Provide all the globals listed here: https://nodejs.org/api/globals.html
    const context = {
      Buffer: Buffer,
      __dirname: path.dirname(file),
      __filename: file,
      clearImmediate: clearImmediate,
      clearInterval: clearInterval,
      clearTimeout: clearTimeout,
      console: console,
      // eslint-disable-next-line node/exports-style
      exports: exports,
      global: global,
      module: m,
      process: process,
      require: pkgPath => {
        // Ugh. Simulate a full require function for the file.
        pkgPath = pkgPath.trim()

        // If absolute, just require.
        if (path.isAbsolute(pkgPath)) return originalrequire(pkgPath)

        // If relative, it's relative to the file.
        if (pkgPath[0] === '.') {
          return originalrequire(path.join(path.dirname(file), pkgPath))
        } else {
          // Not absolute, not relative, must be a globally or locally installed module.
          // Try local first.
          // Here we have to require from the node_modules directory directly.

          let moduleDir = path.dirname(file)
          // eslint-disable-next-line no-constant-condition
          while (true) {
            try {
              return originalrequire(
                path.join(moduleDir, 'node_modules', pkgPath)
              )
            } // eslint-disable-next-line no-empty
            catch (e) {
            }
            const oldModuleDir = moduleDir
            moduleDir = path.join(moduleDir, '..')
            if (moduleDir === oldModuleDir) break
          }

          // Try global, and let the error throw.
          return originalrequire(pkgPath)
        }
      },
      artifacts: options.resolver,
      setImmediate: setImmediate,
      setInterval: setInterval,
      setTimeout: setTimeout
    }

    // Now add contract names.
    Object.keys(options.context || {}).forEach(key => {
      context[key] = options.context[key]
    })

    const old_cwd = process.cwd()

    process.chdir(path.dirname(file))

    const script = vm.createScript(source, file)
    script.runInNewContext(context)

    process.chdir(old_cwd)

    return m.exports
  }
}

module.exports = Require
