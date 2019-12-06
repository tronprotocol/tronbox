const utils = require('./lib/utils')

class Box {

  static async unbox(url, destination, options) {

    options = options || {}
    options.logger = options.logger || {
      log: function () {
      }
    }

    options.logger.log('Downloading...')
    await utils.downloadBox(url, destination)

    options.logger.log('Unpacking...')
    const boxConfig = await utils.unpackBox(destination)

    options.logger.log('Setting up...')
    await utils.setupBox(boxConfig, destination)
    return boxConfig
  }

}

module.exports = Box
