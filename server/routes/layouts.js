'use strict'

const { Router } = require('express')
const { ClientError } = require('../lib/errors')
const { restHandler } = require('../lib/rest-utils')
const { getLayout } = require('../lib/layouts')


module.exports = Router()
.get('/:name', restHandler(req => {
	const layout = getLayout(req.params.name)

	if (!layout) {
		throw new ClientError({ title: `Unknown model "${req.params.name}"`, status: 404 })
	}

	return layout
}))
