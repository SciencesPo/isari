'use strict'

const { Router } = require('express')
const { ClientError } = require('../lib/errors')
const { getSimpleEnumValues, getNestedEnumValues, getSimpleEnumNames, getAllSimpleEnumValues } = require('../lib/enums')
const { restHandler } = require('../lib/rest-utils')


const allSimple = req => {
	if (req.query.noContent === '1') {
		return getSimpleEnumNames()
	} else {
		return getAllSimpleEnumValues()
	}
}

const simple = req => {
	const values = getSimpleEnumValues(req.params.name)
	if (values) {
		return values
	}

	throw new ClientError({ title: `Unknown enum "${req.params.name}"`, status: 404 })
}

const nested = req => {
	const values = getNestedEnumValues(req.params.name)
	if (values) {
		return values
	}

	throw new ClientError({ title: `Unknown nested enum "${req.params.name}"`, status: 404 })
}


module.exports = Router()
.get('/', restHandler(allSimple))
.get('/:name', restHandler(simple))
.get('/nested/:name', restHandler(nested))
