const CIDRMatcher = require('cidr-matcher');
const config = require('../config');
const net = require('net');
const querystring = require('querystring');
const sockjs = require('sockjs');

const matcher = new CIDRMatcher([ '10.0.0.0/8', '172.16.30.0/24' ]);

function getParams(url) {
    var loc = url.indexOf("?");

    if (loc < 0) {
        config.logger.app.info("no query string found");
        return null;
    }

    return querystring.parse(url.substring(loc + 1));
}

function getHost(params) {
    if (!params.host) {
        config.logger.app.info('host not specified in query string: ' + params.host);
        return null;
    }

    if (!matcher.contains(params.host)) {
        config.logger.app.warn("Attempt to proxy to an unauthorized IP: " + params.host);
        return null;
    }

    return params.host;
}

function createClient(conn) {
    var socket = new net.Socket();

    socket.on('error', function(err) {
        config.logger.telnet.warn("Error: " + err.message);

        conn.write('error: ' +  err.message);
        conn.end();
    });

    socket.on('close', function(had_error) {
        config.logger.telnet.debug("telnet connection closed");
        conn.end();
    });

    socket.on('data', function(data) {
        conn.write(data.toString());
    });

    // socket.setTimeout(5000);  // milliseconds

    socket.on('timeout', function() {
        conn.write("Connection timeout.");
        conn.end();
    });

    // socket.on('connect', function() {});
    // socket.on('drain', function() {});
    // socket.on('end', function() {});

    return socket;
}

function onConnection(conn) {

    var params = getParams(conn.url);

    if (params == null) {
        conn.end();
        return;
    }

    var host = getHost(params);

    if (host == null) {
        conn.end();
        return;
    }

    var client = createClient(conn);

    client.connect(19885, host, function() {
        config.logger.telnet.info("Connected to " + host + ":19885");
    });

    conn.on('data', function(message) {
        // we shouldn't receive any information from the websocket.
        config.logger.telnet.warn("data received on websocket: " + message);
    });

    conn.on('close', function() {
        client.end();
    });

}

module.exports = function(server) {
    'use strict';

    var sockjs_server = sockjs.createServer({
        sockjs_url: "https://cdn.jsdelivr.net/sockjs/1.1.2/sockjs.min.js"
    });

    sockjs_server.on('connection', onConnection);
    sockjs_server.installHandlers(server, { prefix: '/sock' });

    server.addListener('upgrade', function(req, res) {
        res.end();
    });

};
