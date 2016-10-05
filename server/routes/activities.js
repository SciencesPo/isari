'use strict'

const { Router } = require('express')
const { ClientError } = require('../lib/errors')
const es = require('../lib/elasticsearch')
const { restHandler } = require('../lib/rest-utils')
const Activity = require('../lib/model')
const bodyParser = require('body-parser')
const { merge, set, map } = require('lodash/fp')


module.exports = Router()
.use(bodyParser.json())
.get('/', restHandler(listActivity))
.get('/:id', restHandler(getActivity))
.put('/:id', restHandler(updateActivity))
.post('/', restHandler(createActivity))
.delete('/:id', restHandler(deleteActivity))
.get('/search', restHandler(searchActivity))


// TODO pagination?
function listActivity () {
	return Activity.find()
		.them(map(formatActivity))
}

function getActivity (req) {
	return Activity.findById(req.params.id)
		.then(found => found
			? formatActivity(found)
			: Promise.reject(ActivityNotFoundErr())
		)
}

function updateActivity (req) {
	return getActivity(req)
		.then(Activity => merge(Activity, req.body))
		.then(saveActivity)
}

function createActivity (req, res) {
	return saveActivity(new Activity(req.body))
		.then(saved => {
			res.status(201)
			return saved
		})
}

function deleteActivity (req, res) {
	return Activity.remove({ _id: req.params.id })
		.then(({ result }) => result.n > 0)
		.then(deleted => deleted || Promise.reject(ActivityNotFoundErr()))
		.then(() => res.status(204))
}

function searchActivity (req) {
	const query = req.query.q
	const fields = req.query.fields ? req.query.fields.split(',') : undefined

	if (!query) {
		throw new ClientError({ title: 'Missing query string (field "q")' })
	}

	return es.q('activity', { query, fields })
}


function saveActivity (activity) {
	return activity.save()
		.then(formatActivity)
		.catch(e => {
			let err = new ClientError({ title: 'Validation error' })
			err.errors = Object.keys(e.errors).reduce((errors, error) => set(error, e.errors[error].message, errors), {})
			return Promise.reject(err)
		})
}

function formatActivity (activity) {
	let o = activity.toObject()

	o.id = o._id

	delete o._id
	delete o.__v

	return o
}

function ActivityNotFoundErr () {
	return new ClientError({
		title: 'Activity not found',
		status: 404
	})
}
