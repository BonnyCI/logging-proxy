const path = require('path')
const stat = require('node-static')
const staticDirectory = new stat.Server(path.join(__dirname, '/data'))

module.exports.register = function (server) {
  'use strict'

  server.addListener('request', function (req, res) {
    staticDirectory.serve(req, res)
  })
}
