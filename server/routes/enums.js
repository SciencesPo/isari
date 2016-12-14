'use strict'

const { Router } = require('express')
const { ClientError } = require('../lib/errors')
const { getSimpleEnumValues, getNestedEnumValues } = require('../lib/enums')
const { restHandler } = require('../lib/rest-utils')


module.exports = Router()
.get('/:name', restHandler(simple))
.get('/nested/:name', restHandler(nested))


function simple (req) {
	const values = getSimpleEnumValues(req.params.name)
	if (values) {
		return values
	}

	throw new ClientError({ title: `Unknown enum "${req.params.name}"`, status: 404 })
}

function nested (req) {
	const values = getNestedEnumValues(req.params.name)
	if (values) {
		return values
	}

	throw new ClientError({ title: `Unknown nested enum "${req.params.name}"`, status: 404 })
}
