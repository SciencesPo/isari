'use strict'

/* eslint no-console:0 */

const auth = require('./lib/auth')

const login = process.argv[2]
const password = process.argv[3]

auth(login, password)
.then(() => (console.log('OK'), process.exit(0)))
.catch(e => (console.error(e.message), process.exit(1)))
