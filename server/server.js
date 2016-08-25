#!/usr/bin/env node

'use strict'

const app = require('./app')
const debug = require('debug')('isari:server')
const { createServer } = require('http')
const config = require('config')

const server = createServer(app)

server.listen(config.http.port)

server.on('listening', () => {
	const addr = server.address()
	const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port
	debug('Listening on ' + bind)
})

server.on('error', err => {
	throw err
})
