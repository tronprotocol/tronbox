const cpr = require('cpr')
const fs = require('fs')
const _ = require('lodash')

const cpr_options = {
  deleteFirst: false,
  overwrite: false,
  confirm: true
}

// This module will copy a file or directory, and by default
// won't override individual files. If a file exists, it will
// simply move onto the next file.

const copy = function (from, to, extra_options, callback) {
  if (typeof extra_options === 'function') {
    callback = extra_options
    extra_options = {}
  }

  const options = _.merge(_.clone(cpr_options), extra_options)

  cpr(from, to, options, function (err, files) {
    const new_files = []

    // Remove placeholders. Placeholders allow us to copy "empty" directories,
    // but lets NPM and git not ignore them.
    files = files || []
    for (const file of files) {
      if (file.match(/.*PLACEHOLDER.*/) != null) {
        fs.unlinkSync(file)
        continue
      }
      new_files.push(file)
    }

    callback(err, new_files)
  })
}

copy.file = function (from, to, callback) {
  const readStream = fs.createReadStream(from, 'utf8')
  const writeStream = fs.createWriteStream(to, 'utf8')

  readStream.on('error', function (err) {
    callback(err)
    callback = function () {
    }
  })

  writeStream.on('error', function (err) {
    callback(err)
    callback = function () {
    }
  })

  writeStream.on('finish', function () {
    callback()
  })

  readStream.pipe(writeStream)
}

module.exports = copy
