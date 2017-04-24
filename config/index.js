'use strict'

const path = require('path')
const winston = require('winston')
const winstonConf = require('winston-config')

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
  .argv

module.exports.port = argv.p
module.exports.bind_host = argv.b
module.exports.isTest = (process.env.NODE_ENV === 'test')

if (module.exports.isTest) {
  // NOTE(jamielennox); I feel like there must be a better way to do this.
  // It should be controlled via tests, but I need to mute it here.
  // taken from https://github.com/rbudiharso/winston-null
  var NullTransport = function () {}

  require('util').inherits(NullTransport, winston.Transport)
  NullTransport.prototype.name = 'NullTransport'
  NullTransport.prototype.log = function (level, msg, meta, callback) {
    callback(null)
  }

  var testLogger = new winston.Logger({
    transports: [new NullTransport()]
  })

  module.exports.logger = {
    app: testLogger,
    telnet: testLogger
  }
} else if (argv.l) {
  var confLogger = winstonConf.fromFileSync(argv.l)

  module.exports.logger = {
    app: confLogger.loggers.get('application'),
    telnet: confLogger.loggers.get('telnet')
  }
} else {
  var defaultLogger = new winston.Logger({
    transports: [
      new winston.transports.Console({
        level: 'debug',
        handleExceptions: true,
        json: false,
        colorize: true
      })
    ],
    exitOnError: true
  })

  module.exports.logger = {
    app: defaultLogger,
    telnet: defaultLogger
  }
}
