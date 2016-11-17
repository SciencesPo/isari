'use strict'

const { Router } = require('express')
const { ClientError } = require('../lib/errors')
const { restHandler } = require('../lib/rest-utils')
const { getLayout } = require('../lib/layouts')
const { scopeOrganizationMiddleware } = require('../lib/permissions')


module.exports = Router()
.get('/:name', scopeOrganizationMiddleware, restHandler(sendLayout))

function sendLayout (req) {
	return req.userCanViewConfidentialFields()
		.then(includeRestricted => getLayout(req.params.name, includeRestricted))
		.then(layout => layout || Promise.reject(ClientError({ title: `Unknown model "${req.params.name}"`, status: 404 })))
}
