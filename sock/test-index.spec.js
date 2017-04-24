'use strict'

const assert = require('chai').assert
const events = require('events')
const sinon = require('sinon')
const sock = require('./index')

beforeEach(function () {
  this.sandbox = sinon.sandbox.create()
})

afterEach(function () {
  this.sandbox.restore()
})

describe('The params fetcher', function () {
  it('handles missing params', function () {
    var result = sock.getParams('http://localhost:3000')
    assert.isNull(result)
  })

  it('fetches single host params', function () {
    var result = sock.getParams('http://localhost:3000?host=10.0.1.1')
    assert.isObject(result)
    assert.deepEqual(result, { host: '10.0.1.1' })
  })

  it('fetches multiple params', function () {
    var result = sock.getParams('http://localhost:3000?host=10.0.1.1&a=b&c=d')
    assert.isObject(result)
    assert.deepEqual(result, { host: '10.0.1.1', a: 'b', c: 'd' })
  })

  it('fetches without host', function () {
    var result = sock.getParams('?a=b&c=d')
    assert.isObject(result)
    assert.deepEqual(result, { a: 'b', c: 'd' })
  })

  it('fails without question mark', function () {
    var result = sock.getParams('a=b&c=d')
    assert.isNull(result)
  })
})

describe('Host validates correctly', function () {
  it('fails if no host set', function () {
    var result = sock.getHost({ a: 'b' })
    assert.isNull(result)
  })

  it('it handles 10.x addresses', function () {
    var result = sock.getHost({ host: '10.0.1.12' })
    assert.equal(result, '10.0.1.12')
  })

  it('it handles 172.16.30.x addresses', function () {
    var result = sock.getHost({ host: '172.16.30.23' })
    assert.equal(result, '172.16.30.23')
  })

  it('it rejects 172.16.31.x addresses', function () {
    var result = sock.getHost({ host: '172.16.31.23' })
    assert.isNull(result)
  })

  it('it rejects 11.x addresses', function () {
    var result = sock.getHost({ host: '11.0.32.11' })
    assert.isNull(result)
  })
})

describe('sock.onConnection', function () {
  function fakeConn () {
    var conn = new events.EventEmitter()
    conn.connect = sinon.stub()
    conn.write = sinon.stub()
    conn.end = sinon.stub()
    return conn
  }

  var host = '10.0.0.1'

  beforeEach(function () {
    this.telnet = fakeConn()
    this.sandbox.stub(sock, 'createSocket').returns(this.telnet)

    this.websocket = fakeConn()
    this.websocket.url = '?host=' + host

    // trigger a connection has been initiated
    sock.onConnection(this.websocket)
  })

  afterEach(function () {
    // telnet will always try to connect when a websocket gets connected
    assert(this.telnet.connect.calledOnce, "it didn't call connect")
    assert(this.telnet.connect.calledWith(19885, host), "it didn't call connect with the right params")

    // we will never write data to telnet
    assert(!this.telnet.write.called)
  })

  it('sends exact data it receives on telnet to websocket', function () {
    var data = 'hello world'

    this.telnet.emit('data', data)
    assert(this.websocket.write.calledOnce)
    assert(this.websocket.write.calledWith(data))
  })

  it('sends error messages with prefix', function () {
    var data = 'hello world'

    this.telnet.emit('error', new Error(data))
    assert(this.websocket.write.calledOnce)
    assert(this.websocket.write.calledWith('error: ' + data))
    assert(this.websocket.end.calledOnce)
  })

  it('closes websocket on telnet timeout', function () {
    this.telnet.emit('timeout')
    assert(this.websocket.end.calledOnce)
  })

  it('closes websocket on telnet close', function () {
    this.telnet.emit('close')
    assert(this.websocket.end.calledOnce)
  })

  it('closes telnet on websocket close', function () {
    this.websocket.emit('close')
    assert(this.telnet.end.calledOnce)
  })
})
