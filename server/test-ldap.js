'use strict'

/* eslint no-console:0 */

const { connect } = require('./lib/model')
const auth = require('./lib/auth')

const login = process.argv[2]
const password = process.argv[3]

connect()
.then(() => auth(login, password))
.then(() => (console.log('OK'), process.exit(0)))
.catch(e => (console.error(e.message), process.exit(1)))
