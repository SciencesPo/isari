'use strict'

const { Router } = require('express')
const { ClientError, ServerError } = require('../lib/errors')
const es = require('../lib/elasticsearch')
const { restHandler } = require('../lib/rest-utils')

module.exports = Router()
.get('/', restHandler(listActivity))
.get('/:id', restHandler(getActivity))
.put('/:id', restHandler(updateActivity))
.post('/', restHandler(createActivity))
.delete('/:id', restHandler(deleteActivity))
.get('/search', restHandler(searchActivity))


function listActivity () {
	throw new ServerError({ status: 501, title: 'TODO' })
}

function getActivity () {
	throw new ServerError({ status: 501, title: 'TODO' })
}

function updateActivity () {
	throw new ServerError({ status: 501, title: 'TODO' })
}

function createActivity () {
	throw new ServerError({ status: 501, title: 'TODO' })
}

function deleteActivity () {
	throw new ServerError({ status: 501, title: 'TODO' })
}

function searchActivity (req) {
	const query = req.query.q
	const fields = req.query.fields ? req.query.fields.split(',') : undefined

	if (!query) {
		throw new ClientError({ title: 'Missing query string (field "q")' })
	}

	throw new ServerError({ status: 501, title: 'TODO' })
}
