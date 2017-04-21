const CIDRMatcher = require('cidr-matcher');
const http = require('http');
const net = require('net');
const node_static = require('node-static');
const querystring = require('querystring');
const sockjs = require('sockjs');

var matcher = new CIDRMatcher([ '10.0.0.0/8', '172.16.30.0/24' ]);

const node_host = process.env.NODE_HOST || "0.0.0.0";
const node_port = process.env.NODE_PORT || 3000;

var sockjs_server = sockjs.createServer({
    sockjs_url: "https://cdn.jsdelivr.net/sockjs/1.1.2/sockjs.min.js"
});

sockjs_server.on('connection', function(conn) {

    loc = conn.url.indexOf("?");

    if (loc < 0) {
        console.log("no query string found");
        conn.close()
        return;
    }

    qs = querystring.parse(conn.url.substring(loc + 1));
    host = qs["host"];

    if (!host) {
        console.log('host not specified in query string');
        conn.close()
        return;
    }

    if (!matcher.contains(host)) {
        console.log("Attempt to proxy to an unauthorized IP: " + host);
        conn.close();
        return;
    }

    var client = net.connect(19885, host, function() {
        // this callback gets triggered when a successful connection is established

        client.on('close', function(had_error) {
            console.log("telnet connection closed");
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
        console.log("error: " + err.message);
        conn.write('error: ' +  err.message);
        conn.end()
    });

    console.log("setup complete to IP: " + host);

    conn.on('data', function(message) {
        // we shouldn't receive any information from the websocket.
        console.log("data received on websocket: " + message);
    });

    conn.on('close', function() {
        client.end();
    });

});

var static_directory = new node_static.Server(__dirname);
var server = http.createServer();

server.addListener('request', function(req, res) {
    static_directory.serve(req, res);
});

server.addListener('upgrade', function(req,res) {
    res.end();
});

sockjs_server.installHandlers(server, { prefix: '/sock' });

console.log('listening on ' + node_host + ':' + node_port);
server.listen(node_port, node_host);
