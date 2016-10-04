'use strict'

const { Router } = require('express')
const { ClientError } = require('../lib/errors')
const metas = require('../../specs/schema.meta.json')
const { restHandler } = require('../lib/rest-utils')

module.exports = Router()
.get('/:name', restHandler(getSchema))


function getSchema (req) {
	const name = req.params.name.toLowerCase()

	for (let key in metas) {
		if (key.toLowerCase() === name) {
			return formatMeta(metas[key])
		}
	}

	throw new ClientError({ title: `Unknown model "${req.params.name}"`, status: 404 })
}

function formatMeta (data) {
	// TODO format for frontend needs
	return Promise.resolve(data)
}
