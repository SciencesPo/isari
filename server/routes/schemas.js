'use strict'

const { Router } = require('express')
const { ClientError } = require('../lib/errors')
const { restHandler } = require('../lib/rest-utils')
const { getFrontSchema } = require('../lib/schemas')


module.exports = Router()
.get('/:name', restHandler(getSchema))


function getSchema (req) {
	const schema = getFrontSchema(req.params.name, {
		admin: false // TODO from web session
	})

	if (!schema) {
		throw new ClientError({ title: `Unknown model "${req.params.name}"`, status: 404 })
	}

	return schema
}
