'use strict'

const { Router } = require('express')
const { ServerError, ClientError, NotFoundError } = require('./errors')
const { identity, set, merge, map } = require('lodash/fp')
const bodyParser = require('body-parser')
const es = require('./elasticsearch')


const restHandler = exports.restHandler = fn => (req, res, next) => {
	Promise.resolve().then(() => fn(req, res)).then(data => res.send(data)).catch(err => {
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
	const formatAll = map(format)
	const router = Router()
		.use(bodyParser.json())
		.get('/', restHandler(listModel(Model, formatAll)))
		.get('/:id', restHandler(getModel(Model, format)))
		.put('/:id', restHandler(updateModel(Model, save)))
		.post('/', restHandler(createModel(Model, save)))
		.delete('/:id', restHandler(deleteModel(Model)))

	if (esIndex) {
		router.get('/search', restHandler(searchModel(esIndex, formatAll)))
	}

	return router
}

const listModel = (Model, formatAll) => () =>
	Model.find().them(formatAll)

const getModel = (Model, format) => req =>
	Model.findById(req.params.id)
	.then(found => found || Promise.reject(NotFoundError({ title: Model.modelName })))
	.then(format)

const updateModel = (Model, save) => {
	const get = getModel(Model, identity)
	return req => get(req).then(doc => {
		const updated = merge(doc, req.body)
		new Model(updated) // Triggers StrictModeError in case of extra fields
		return save(updated)
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
	return save(o).then(saved => {
		res.status(201)
		return saved
	})
}

const deleteModel = Model => (req, res) =>
	Model.remove({ _id: req.params.id })
	.then(({ result }) => result.n > 0)
	.then(deleted => deleted || Promise.reject(NotFoundError({ title: Model.modelName })))
	.then(() => res.status(204))

const searchModel = (esIndex, formatAll) => req => {
	const query = req.query.q
	const fields = req.query.fields ? req.query.fields.split(',') : undefined

	if (!query) {
		throw new ClientError({ title: 'Missing query string (field "q")' })
	}

	return es.q(esIndex, { query, fields }).then(formatAll)
}
