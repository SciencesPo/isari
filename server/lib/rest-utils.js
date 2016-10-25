'use strict'

const { Router } = require('express')
const { ServerError, ClientError, NotFoundError } = require('./errors')
const { identity, set, map, compose, pick } = require('lodash/fp')
const bodyParser = require('body-parser')
const es = require('./elasticsearch')


const restHandler = exports.restHandler = fn => (req, res, next) => {
	Promise.resolve().then(() => fn(req, res))
	.then(data => res.send(data))
	.catch(err => {
		if (!err.status) {
			err.status = 500
		}
		next(err)
	})
}


const saveDocument = (format = identity) => doc => doc.save()
	.then(format)
	.catch(e => {
		let err = new ClientError({ title: 'Validation error' })
		if (e.name === 'ValidationError') {
			err.errors = Object.keys(e.errors).reduce(
				(errors, error) => set(error, e.errors[error].message, errors),
				{}
			)
		}
		return Promise.reject(err)
	})


exports.restRouter = (Model, format = identity, esIndex = null) => {
	const save = saveDocument(format)
	const router = Router()

	router.use(bodyParser.json())

	if (esIndex) {
		router.get('/search', restHandler(searchModel(esIndex, Model, format)))
	}

	router.get('/', restHandler(listModel(Model, format)))
	router.get('/:id', restHandler(getModel(Model, format)))
	router.get('/:id/string', restHandler(getModelString(Model)))
	router.put('/:id', restHandler(updateModel(Model, save)))
	router.post('/', restHandler(createModel(Model, save)))
	router.delete('/:id', restHandler(deleteModel(Model)))

	return router
}

const listModel = (Model, format) => req => {
	const selectFields = req.query.fields ? pick(req.query.fields.split(',')) : identity
	// Note: we don't apply field selection directly in query as some fields may be not asked, but
	// required for some other fields' templates to be correctly calculated
	return Model.find().then(peoples => Promise.all(peoples.map(people =>
		people.populateAll().then(p => req.query.applyTemplates ? p.applyTemplates() : p).then(format).then(selectFields)
	)))
}

const getModel = (Model, format) => req =>
	Model.findById(req.params.id)
	.then(found => found || Promise.reject(NotFoundError({ title: Model.modelName })))
	.then(format)

const getModelString = Model => req =>
	Model.findById(req.params.id)
	.then(found => found || Promise.reject(NotFoundError({ title: Model.modelName })))
	.then(o => ({ id: String(o._id), value: o.applyTemplates(0) }))

const updateModel = (Model, save) => {
	const get = getModel(Model, identity)
	return req => get(req).then(doc => {
		Object.keys(req.body).forEach(field => {
			doc[field] = req.body[field]
		})
		doc._elWho = 'TODO GET USERNAME FROM WEB SESSION (update)'
		return save(doc)
	})
}

const createModel = (Model, save) => (req, res) => {
	let o
	try {
		o = new Model(req.body)
	} catch (e) {
		if (e.name === 'StrictModeError') {
			// Extra fields
			return Promise.reject(ClientError({ title: e.message }))
		} else {
			return Promise.reject(ServerError({ title: e.message }))
		}
	}
	o._elWho = 'TODO GET USERNAME FROM WEB SESSION (create)'
	return save(o).then(saved => {
		res.status(201)
		return saved
	})
}

const deleteModel = Model => (req, res) =>
	Model.findById(req.params.id)
	.then(found => found || Promise.reject(NotFoundError({ title: Model.modelName })))
	.then(doc => {
		doc._elWho = 'TODO GET USERNAME FROM WEB SESSION (delete)'
		return doc.remove()
	})
	.then(() => {
		res.status(204)
		return null
	})

const searchModel = (esIndex, Model, format) => req => {
	const query = req.query.q
	const fields = req.query.fields ? req.query.fields.split(',') : undefined
	const full = Boolean(Number(req.query.full))

	if (!query) {
		throw new ClientError({ title: 'Missing query string (field "q")' })
	}

	return es.q(esIndex, { query, fields }).then(map(Model)).then(map(o => full
		? format(o)
		: { value: o.id, label: o.applyTemplates(0) }
	))
}
