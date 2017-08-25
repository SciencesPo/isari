'use strict'

const { name, version } = require('../package.json')
const { Router } = require('express')

exports.index = Router().get('/', (req, res) => res.send({
	name,
	version
}))


exports.people = require('./people')
exports.activities = require('./activities')
exports.organizations = require('./organizations')

exports.schemas = require('./schemas')
exports.enums = require('./enums')
exports.layouts = require('./layouts')
exports.columns = require('./columns')

exports.export = require('./export')
exports.editLog = require('./editLog')

exports.errors = require('./errors')
exports.auth = require('./auth')
