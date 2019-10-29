const http = require('http')
const finalhandler = require('finalhandler')
const serveStatic = require('serve-static')
const path = require('path')

const Serve = {
  start: function (options, done) {
    const serve = serveStatic(options.build_directory)

    const server = http.createServer(function (req, res) {
      const done = finalhandler(req, res)
      serve(req, res, done)
    })

    const port = options.port || options.p || 8080

    server.listen(port)

    const display_directory = '.' + path.sep + path.relative(options.working_directory, options.build_directory)

    options.logger.log('Serving static assets in ' + display_directory + ' on port ' + port + '...')
    done()
  }
}

module.exports = Serve
