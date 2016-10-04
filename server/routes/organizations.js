'use strict'

const { Router } = require('express')
const { ClientError, ServerError } = require('../lib/errors')
const es = require('../lib/elasticsearch')
const { restHandler } = require('../lib/rest-utils')

module.exports = Router()
.get('/', restHandler(listOrganization))
.get('/:id', restHandler(getOrganization))
.put('/:id', restHandler(updateOrganization))
.post('/', restHandler(createOrganization))
.delete('/:id', restHandler(deleteOrganization))
.get('/search', restHandler(searchOrganization))


function listOrganization () {
	throw new ServerError({ status: 501, title: 'TODO' })
}

function getOrganization () {
	throw new ServerError({ status: 501, title: 'TODO' })
}

function updateOrganization () {
	throw new ServerError({ status: 501, title: 'TODO' })
}

function createOrganization () {
	throw new ServerError({ status: 501, title: 'TODO' })
}

function deleteOrganization () {
	throw new ServerError({ status: 501, title: 'TODO' })
}

function searchOrganization (req) {
	const query = req.query.q
	const fields = req.query.fields ? req.query.fields.split(',') : undefined

	if (!query) {
		throw new ClientError({ title: 'Missing query string (field "q")' })
	}

	throw new ServerError({ status: 501, title: 'TODO' })
}
