'use strict'

const { Router } = require('express')
const { ClientError } = require('../lib/errors')
const es = require('../lib/elasticsearch')
const { restHandler } = require('../lib/rest-utils')
const Organization = require('../lib/model')
const bodyParser = require('body-parser')
const { merge, set, map } = require('lodash/fp')


module.exports = Router()
.use(bodyParser.json())
.get('/', restHandler(listOrganization))
.get('/:id', restHandler(getOrganization))
.put('/:id', restHandler(updateOrganization))
.post('/', restHandler(createOrganization))
.delete('/:id', restHandler(deleteOrganization))
.get('/search', restHandler(searchOrganization))


// TODO pagination?
function listOrganization () {
	return Organization.find()
		.them(map(formatOrganization))
}

function getOrganization (req) {
	return Organization.findById(req.params.id)
		.then(found => found
			? formatOrganization(found)
			: Promise.reject(OrganizationNotFoundErr())
		)
}

function updateOrganization (req) {
	return getOrganization(req)
		.then(Organization => merge(Organization, req.body))
		.then(saveOrganization)
}

function createOrganization (req, res) {
	return saveOrganization(new Organization(req.body))
		.then(saved => {
			res.status(201)
			return saved
		})
}

function deleteOrganization (req, res) {
	return Organization.remove({ _id: req.params.id })
		.then(({ result }) => result.n > 0)
		.then(deleted => deleted || Promise.reject(OrganizationNotFoundErr()))
		.then(() => res.status(204))
}

function searchOrganization (req) {
	const query = req.query.q
	const fields = req.query.fields ? req.query.fields.split(',') : undefined

	if (!query) {
		throw new ClientError({ title: 'Missing query string (field "q")' })
	}

	return es.q('organization', { query, fields })
}


function saveOrganization (organization) {
	return organization.save()
		.then(formatOrganization)
		.catch(e => {
			let err = new ClientError({ title: 'Validation error' })
			err.errors = Object.keys(e.errors).reduce((errors, error) => set(error, e.errors[error].message, errors), {})
			return Promise.reject(err)
		})
}

function formatOrganization (organization) {
	let o = organization.toObject()

	o.id = o._id

	delete o._id
	delete o.__v

	return o
}

function OrganizationNotFoundErr () {
	return new ClientError({
		title: 'Organization not found',
		status: 404
	})
}
