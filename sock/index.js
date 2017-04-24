const CIDRMatcher = require('cidr-matcher')
const config = require('../config')
const net = require('net')
const querystring = require('querystring')
const sockjs = require('sockjs')

const matcher = new CIDRMatcher([ '10.0.0.0/8', '172.16.30.0/24' ])

function getParams (url) {
  var loc = url.indexOf('?')

  if (loc < 0) {
    config.logger.app.info('no query string found')
    return null
  }

  return querystring.parse(url.substring(loc + 1))
}

function getHost (params) {
  if (!params.host) {
    config.logger.app.info('host not specified in query string: ' + params.host)
    return null
  }

  if (!matcher.contains(params.host)) {
    config.logger.app.warn('Attempt to proxy to an unauthorized IP: ' + params.host)
    return null
  }

  return params.host
}

function createSocket () {
  // A function for better mocking
  return new net.Socket()
}

exports.createSocket = createSocket

function createClient (conn) {
  var socket = exports.createSocket()

  socket.on('error', function (err) {
    config.logger.telnet.warn('Error: ' + err.message)

    conn.write('error: ' + err.message)
    conn.end()
  })

  socket.on('close', function (hadError) {
    config.logger.telnet.debug('telnet connection closed')
    conn.end()
  })

  socket.on('data', function (data) {
    conn.write(data.toString())
  })

  // socket.setTimeout(5000);  // milliseconds

  socket.on('timeout', function () {
    conn.write('Connection timeout.')
    conn.end()
  })

  // socket.on('connect', function () {})
  // socket.on('drain', function () {})
  // socket.on('end', function () {})

  return socket
}

function onConnection (conn) {
  var params = getParams(conn.url)

  if (params === null) {
    conn.end()
    return
  }

  var host = getHost(params)

  if (host === null) {
    conn.end()
    return
  }

  var client = createClient(conn)

  client.connect(19885, host, function () {
    config.logger.telnet.info('Connected to ' + host + ':19885')
  })

  conn.on('data', function (message) {
    // we shouldn't receive any information from the websocket.
    config.logger.telnet.warn('data received on websocket: ' + message)
  })

  conn.on('close', function () {
    client.end()
  })
}

exports.onConnection = onConnection

module.exports.register = function (server) {
  'use strict'

  var sockJsServer = sockjs.createServer({
    sockjs_url: 'https://cdn.jsdelivr.net/sockjs/1.1.2/sockjs.min.js'
  })

  sockJsServer.on('connection', exports.onConnection)
  sockJsServer.installHandlers(server, { prefix: '/sock' })

  server.addListener('upgrade', function (req, res) {
    res.end()
  })
}

if (config.isTest) {
  module.exports.getHost = getHost
  module.exports.getParams = getParams
}
