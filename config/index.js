'use strict'

const path = require('path');
const winston = require('winston');
const winstonConf = require('winston-config');

var argv = require('yargs')
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

module.exports.port = argv.p;
module.exports.bind_host = argv.b;

if (argv.l) {
    var logger = winstonConf.fromFileSync(argv.l);

    module.exports.logger = {
        app: logger.loggers.get('application'),
        telnet: logger.loggers.get('telnet')
    };

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

    module.exports.logger = {
        app: logger,
        telnet: logger
    };
}
