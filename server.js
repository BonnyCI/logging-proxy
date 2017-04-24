#!/usr/bin/env node

'use strict'

const config = require('./config')
const http = require('http')

var server = http.createServer()

require('./static').register(server)
require('./sock').register(server)

config.logger.app.info('listening on ' + config.bind_host + ':' + config.port)
server.listen(config.port, config.bind_host)
