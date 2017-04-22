const node_static = require('node-static');

var static_directory = new node_static.Server(__dirname + "/data");

module.exports = function(server) {
    'use strict';

    server.addListener('request', function(req, res) {
        static_directory.serve(req, res);
    });

};
