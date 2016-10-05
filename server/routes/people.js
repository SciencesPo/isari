'use strict'

const { Router } = require('express')
const { ClientError, ServerError } = require('../lib/errors')
const es = require('../lib/elasticsearch')
const { restHandler } = require('../lib/rest-utils')
const People = require('../lib/model')
const bodyParser = require('body-parser')
const { merge, set, map } = require('lodash/fp')


module.exports = Router()
.use(bodyParser.json())
.get('/', restHandler(listPeople))
.get('/:id', restHandler(getPeople))
.put('/:id', restHandler(updatePeople))
.post('/', restHandler(createPeople))
.delete('/:id', restHandler(deletePeople))
.get('/search', restHandler(searchPeople))


// TODO pagination?
function listPeople () {
	return People.find()
		.them(map(formatPeople))
}

function getPeople (req) {
	return People.findById(req.params.id)
		.then(found => found
			? formatPeople(found)
			: Promise.reject(peopleNotFoundErr())
		)
}

function updatePeople (req) {
	return getPeople(req)
		.then(people => merge(people, req.body))
		.then(savePeople)
}

function createPeople (req, res) {
	return savePeople(new People(req.body))
		.then(saved => {
			res.status(201)
			return saved
		})
}

function deletePeople (req) {
	return People.remove({ _id: req.params.id })
		.then(({ result }) => result.n > 0)
		.then(deleted => deleted || Promise.reject(peopleNotFoundErr()))
		.then(() => res.status(204))
}

function searchPeople (req) {
	const query = req.query.q
	const fields = req.query.fields ? req.query.fields.split(',') : undefined

	if (!query) {
		throw new ClientError({ title: 'Missing query string (field "q")' })
	}

	return es.q('people', { query, fields })
}


function savePeople (people) {
	return people.save()
		.then(formatPeople)
		.catch(e => {
			let err = new ClientError({ title: 'Validation error' })
			err.errors = Object.keys(e.errors).reduce((errors, error) => set(error, e.errors[error].message, errors), {})
			return Promise.reject(err)
		})
}

function formatPeople (people) {
	let o = people.toObject()

	o.id = o._id

	delete o._id
	delete o.__v

	return o
}

function peopleNotFoundErr () {
	return new ClientError({
		title: 'People not found',
		status: 404
	})
}
