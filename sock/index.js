'use strict'

const CIDRMatcher = require('cidr-matcher');
const config = require('../config');
const net = require('net');
const querystring = require('querystring');
const sockjs = require('sockjs');

const matcher = new CIDRMatcher([ '10.0.0.0/8', '172.16.30.0/24' ]);

module.exports = function(server) {

    var sockjs_server = sockjs.createServer({
        sockjs_url: "https://cdn.jsdelivr.net/sockjs/1.1.2/sockjs.min.js"
    });

    sockjs_server.on('connection', function(conn) {

        var loc = conn.url.indexOf("?");

        if (loc < 0) {
            config.logger.app.info("no query string found");
            conn.close()
            return;
        }

        var qs = conn.url.substring(loc + 1)
        var params = querystring.parse(qs);

        if (!params.host) {
            config.logger.app.info('host not specified in query string: ' + qs);
            conn.close()
            return;
        }

        if (!matcher.contains(params.host)) {
            config.logger.app.warning("Attempt to proxy to an unauthorized IP: " + params.host);
            conn.close();
            return;
        }

        var client = net.connect(19885, params.host, function() {
            // this callback gets triggered when a successful connection is established

            client.on('close', function(had_error) {
                config.logger.telnet.debug("telnet connection closed");
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
            config.logger.telnet.warning("Error: " + err.message);
            conn.write('error: ' +  err.message);
            conn.end()
        });

        config.logger.app.debug("setup complete to IP: " + params.host);

        conn.on('data', function(message) {
            // we shouldn't receive any information from the websocket.
            config.logger.telnet.warning("data received on websocket: " + message);
        });

        conn.on('close', function() {
            client.end();
        });

    });

    server.addListener('upgrade', function(req,res) {
        res.end();
    });

    sockjs_server.installHandlers(server, { prefix: '/sock' });

};
