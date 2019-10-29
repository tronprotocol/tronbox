var {TronWeb} = require('../TronWrap')
var wrapper = require('./wrapper')

module.exports = {
  wrap: function (provider, options) {
    return wrapper.wrap(provider, options)
  },

  create: function (options) {
    var provider

    if (options.provider && typeof options.provider === 'function') {
      provider = options.provider()
    } else if (options.provider) {
      provider = options.provider
    } else {

      const HttpProvider = TronWeb.providers.HttpProvider

      HttpProvider.prototype.send = function (payload) {
        var request = this.prepareRequest(false)

        try {
          request.send(JSON.stringify(payload))
        } catch (error) {
          throw new Error(`Invalid Connection (${this.host})`)
        }

        var result = request.responseText

        try {
          result = JSON.parse(result)
        } catch (e) {
          throw new Error(`Invalid Response (${request.responseText})`)
        }

        return result
      }

      HttpProvider.prototype.sendAsync = function (payload, callback) {
        var request = this.prepareRequest(true)

        request.onreadystatechange = function () {
          if (request.readyState === 4 && request.timeout !== 1) {
            var result = request.responseText
            var error = null

            try {
              result = JSON.parse(result)
            } catch (e) {
              error = new Error(`Invalid Response (${request.responseText})`)
            }

            callback(error, result)
          }
        }

        request.ontimeout = function () {
          throw new Error(`Connection Timeout (${this.timeout})`)
        }

        try {
          request.send(JSON.stringify(payload))
        } catch (error) {
          callback(new Error(`Invalid Connection (${this.host})`))
        }
        return request
      }

      provider = new HttpProvider(options.fullHost)
    }
    return this.wrap(provider, options)
  },

  test_connection: function (provider, callback) {
    callback(null, true)
  }
}
