#!/usr/bin/env node

'use strict'

const config = require('./config');
const http = require('http');

var server = http.createServer();

require('./static')(server);
require('./sock')(server);

config.logger.app.info('listening on ' + config.bind_host + ':' + config.port);
server.listen(config.port, config.bind_host);
