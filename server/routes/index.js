'use strict'

const { name, version } = require('../package.json')
const { Router } = require('express')

exports.index = Router().get('/', (req, res) => res.send({
	name,
	version
}))

exports.people = require('./people')
exports.errors = require('./errors')
exports.auth = require('./auth')
