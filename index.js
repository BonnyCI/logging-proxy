#!/usr/bin/env node

const CIDRMatcher = require('cidr-matcher');
const http = require('http');
const net = require('net');
const node_static = require('node-static');
const path = require('path');
const querystring = require('querystring');
const sockjs = require('sockjs');
const winston = require('winston');
const winstonConf = require('winston-config');
const yargs = require('yargs');

var argv = yargs
    .usage('Usage: $0 <command> [options]')
    .env('BLP')
    .option('l', {
        alias: 'log-config',
        nargs: 1,
        describe: 'Load winston config logging from file',
        normalize: true,
        coerce: path.resolve
    })
    .option('p', {
        alias: 'port',
        nargs: 1,
        describe: 'The port to listen on',
        number: true,
        default: 3000
    })
    .option('b', {
        alias: 'bind',
        nargs: 1,
        describe: 'The interface IP to bind to',
        string: true,
        default: '0.0.0.0'
    })
    .help('h')
    .alias('h', 'help')
    .argv;

if (argv.l) {
    var logger = winstonConf.fromFileSync(argv.l);

    var appLogger = logger.loggers.get('application');
    var telnetLogger = logger.loggers.get('telnet');
} else {
    var logger = new winston.Logger({
        transports: [
            new winston.transports.Console({
                level: 'debug',
                handleExceptions: true,
                json: false,
                colorize: true
            })
        ],
        exitOnError: true
    });

    var appLogger = logger;
    var telnetLogger = logger;
}

var matcher = new CIDRMatcher([ '10.0.0.0/8', '172.16.30.0/24' ]);

var sockjs_server = sockjs.createServer({
    sockjs_url: "https://cdn.jsdelivr.net/sockjs/1.1.2/sockjs.min.js"
});

sockjs_server.on('connection', function(conn) {

    loc = conn.url.indexOf("?");

    if (loc < 0) {
        appLogger.info("no query string found");
        conn.close()
        return;
    }

    qs = conn.url.substring(loc + 1)
    params = querystring.parse(qs);
    host = params["host"];

    if (!host) {
        appLogger.info('host not specified in query string: ' + qs);
        conn.close()
        return;
    }

    if (!matcher.contains(host)) {
        appLogger.warning("Attempt to proxy to an unauthorized IP: " + host);
        conn.close();
        return;
    }

    var client = net.connect(19885, host, function() {
        // this callback gets triggered when a successful connection is established

        client.on('close', function(had_error) {
            telnetLogger.debug("telnet connection closed");
            conn.close();
        });

        client.on('data', function(data) {
            conn.write(data.toString());
        });

        // client.on('connect', function() {});

        // client.on('drain', function() {});
        // client.on('end', function() {});

        // client.on('timeout', function() {});
    });

    client.on('error', function(err) {
        // this handler is outside the connect callback to handle errors before
        // connect occurs
        telnetLogger.warning("Error: " + err.message);
        conn.write('error: ' +  err.message);
        conn.end()
    });

    appLogger.debug("setup complete to IP: " + host);

    conn.on('data', function(message) {
        // we shouldn't receive any information from the websocket.
        telnetLogger.warning("data received on websocket: " + message);
    });

    conn.on('close', function() {
        client.end();
    });

});

var server = http.createServer();

require('./static')(server);

server.addListener('upgrade', function(req,res) {
    res.end();
});

sockjs_server.installHandlers(server, { prefix: '/sock' });

appLogger.info('listening on ' + argv.b + ':' + argv.p);
server.listen(argv.p, argv.b);
