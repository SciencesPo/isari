'use strict'

const { Router } = require('express')
const { NotFoundError } = require('../lib/errors')
const { restHandler } = require('../lib/rest-utils')
const { getFrontSchema } = require('../lib/schemas')
const { requiresAuthentication, scopeOrganizationMiddleware } = require('../lib/permissions')


module.exports = Router()
.get('/:name', requiresAuthentication, scopeOrganizationMiddleware, restHandler(getSchema))

function getSchema (req) {
	return req.userCanViewConfidentialFields()
		.then(includeRestricted => getFrontSchema(req.params.name, includeRestricted))
		.catch(err => err.code === 'MODULE_NOT_FOUND' ? null : Promise.reject(err))
		.then(schema => schema || Promise.reject(NotFoundError({ title: `Unknown model "${req.params.name}"` })))
}
