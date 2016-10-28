'use strict'

const { Router } = require('express')
const { NotFoundError } = require('../lib/errors')
const { restHandler } = require('../lib/rest-utils')
const { getFrontSchema } = require('../lib/schemas')


module.exports = Router()
.get('/:name', restHandler(getSchema))


function getSchema (req) {
	return Promise.resolve()
		.then(() => getFrontSchema(req.params.name, {
			admin: false // TODO from web session
		}))
		.catch(err => err.code === 'MODULE_NOT_FOUND' ? null : Promise.reject(err))
		.then(schema => schema || Promise.reject(NotFoundError({ title: `Unknown model "${req.params.name}"` })))
}
