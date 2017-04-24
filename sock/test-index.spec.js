'use strict'

const assert = require('chai').assert
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
