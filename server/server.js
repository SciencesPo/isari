#!/usr/bin/env node

'use strict'

const app = require('./app')
const debug = require('debug')('isari:server')
const { createServer } = require('http')
const config = require('config')
const chalk = require('chalk')
const { connect } = require('./lib/model')


const server = createServer(app)

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at:', p);
  // application specific logging, throwing an error, or other logic here
});

server.on('listening', () => {
	const addr = server.address()
	const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port
	debug('Listening on ' + bind)
})

server.on('error', err => {
	throw err
})

connect()
.then(() => {
	process.stdout.write('Established connection to MongoDB')
	server.listen(config.http.port)
})
.catch(e => {
	process.stderr.write(`\n\n${chalk.bold.red('Could not connect to MongoDB')}:\n${chalk.red(e.message)}\n\n`)
	process.exit(1)
})
