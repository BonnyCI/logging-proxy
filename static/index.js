const path = require('path')
const staticDirectory = new (require('node-static').Server)(path.join(__dirname, '/data'))

module.exports.register = function (server) {
  'use strict'

  server.addListener('request', function (req, res) {
    staticDirectory.serve(req, res)
  })
}
