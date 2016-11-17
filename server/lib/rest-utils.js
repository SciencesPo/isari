'use strict'

const { Router } = require('express')
const { ServerError, ClientError, NotFoundError, UnauthorizedError } = require('./errors')
const { identity, set, map, pick, difference } = require('lodash/fp')
const bodyParser = require('body-parser')
const es = require('./elasticsearch')
const { applyTemplates, populateAllQuery } = require('./model-utils')
const debug = require('debug')('isari:rest')
const { scopeOrganizationMiddleware } = require('./permissions')


const restHandler = exports.restHandler = fn => (req, res, next) => {
	Promise.resolve().then(() => fn(req, res))
	.then(data => res.send(data))
	.catch(err => {
		if (!err.status) {
			err.status = err.errors ? 400 : 500
		}
		next(err)
	})
}

const extractMongooseValidationError = err => {
	let errors = {}
	for (let k in err.errors) {
		if (err.errors.hasOwnProperty(k)) {
			const fieldError = err.errors[k]
			errors[k] = !fieldError.errors
				? // Field error: extract message
					fieldError.message
				: // Recursive errors, for a change
					extractMongooseValidationError(fieldError)
		}
	}
	return errors
}

const saveDocument = (format = identity) => doc => {
	return doc.save()
		.then(format)
		.catch(e => {
			let err = new ClientError({ title: 'Validation error' })
			if (e.name === 'ValidationError') {
				err.errors = extractMongooseValidationError(e)
			}
			return Promise.reject(err)
		})
}


// http.ServerRequest, mongoose.Model => Promise<{ editable }>
const defaultGetPermissions = (req, object) => Promise.resolve({ // eslint-disable-line no-unused-vars
	editable: true // TODO check permissions in req.session against object
})

const formatWithOpts = (req, format, getPermissions, applyTemplates) => o =>
	Promise.all([
		getPermissions(req, o),
		format(applyTemplates ? o.applyTemplates() : o)
	])
	.then(([ { editable }, o ]) => set('opts', { editable })(o))

const requiresAuthentication = (req, res, next) => {
	if (req.session.login) {
		next()
	} else {
		next(UnauthorizedError({ title: 'Authentication required for this API' }))
	}
}

// buildListQuery can be a function returning an object { query: PromiseOfMongooseQuery } (embedding in an object to not accidentally convert query into a promise of Results)
exports.restRouter = (Model, format = identity, esIndex = null, getPermissions = defaultGetPermissions, buildListQuery = null) => {
	const save = saveDocument(format)
	const router = Router()

	const parseJson = bodyParser.json()

	if (esIndex) {
		// TODO apply permissions in /search ? (NOT FUNNY AT ALL)
		router.get('/search', parseJson, requiresAuthentication, restHandler(searchModel(esIndex, Model, format, getPermissions)))
	}

	router.get('/', parseJson, requiresAuthentication, scopeOrganizationMiddleware, restHandler(listModel(Model, format, getPermissions, buildListQuery)))
	router.get('/:id([A-Za-f0-9]{24})', parseJson, requiresAuthentication, scopeOrganizationMiddleware, restHandler(getModel(Model, format, getPermissions)))
	router.get('/:ids([A-Za-f0-9,]+)/string', parseJson, requiresAuthentication, /* TODO check permissions */ restHandler(getModelStrings(Model)))
	router.put('/:id([A-Za-f0-9]{24})', parseJson, requiresAuthentication, /* TODO check permissions */ restHandler(updateModel(Model, save, getPermissions)))
	router.post('/', parseJson, requiresAuthentication, /* TODO check permissions */ restHandler(createModel(Model, save)))
	router.delete('/:id([A-Za-f0-9]{24})', parseJson, requiresAuthentication, /* TODO check permissions */ restHandler(deleteModel(Model, getPermissions)))

	return router
}

const listModel = (Model, format, getPermissions, buildListQuery = null) => req => {
	debug('List: start', req.originalUrl)
	// Always keep 'opts' technical field
	const selectFields = req.query.fields ? pick(req.query.fields.split(',').concat([ 'opts' ])) : identity
	const applyTemplates = Boolean(Number(req.query.applyTemplates))
	const formatOne = formatWithOpts(req, format, getPermissions, applyTemplates)
	// Note: we don't apply field selection directly in query as some fields may be not asked, but
	// required for some other fields' templates to be correctly calculated
	const withPopulate = q => (applyTemplates ? populateAllQuery(q, Model.modelName) : q).exec()
	const query = buildListQuery
		? buildListQuery(req).then(({ query }) => withPopulate(query))
		: withPopulate(Model.find())
	return query
		.then(data => { debug('List: Model.find', data.length + ' result(s)'); return data })
		.then(data => { debug('List: applyTemplates', applyTemplates); return data })
		.then(peoples => Promise.all(peoples.map(formatOne)))
		.then(data => { debug('List: formatWithOpts'); return data })
		.then(data => data.map(selectFields))
		.then(data => { debug('List: selectFields', req.query.fields); return data })
}

const getModel = (Model, format, getPermissions) => req =>
	Model.findById(req.params.id)
	.then(found => found || Promise.reject(NotFoundError({ title: Model.modelName })))
	.then(formatWithOpts(req, format, getPermissions, false))

const getModelStrings = Model => req => {
	const ids = req.params.ids.split(',')
	const invalids = ids.filter(id => !id.match(/^[A-Za-f0-9]{24}$/))
	if (invalids.length > 0) {
		return Promise.reject(ClientError({ title: `Invalid ObjectId: ${invalids.join(', ')}` }))
	}
	return Model.find({ _id: { $in: ids } })
		.then(founds => {
			const missing = difference(ids, map('id', founds))
			if (missing.length > 0) {
				return Promise.reject(NotFoundError({ title: `Model "${Model.modelName}" returned nothing for IDs ${missing.join(', ')}` }))
			}
			// Map over ids instead of found object to keep initial order
			return Promise.all(ids.map(id => founds.find(o => o.id === id).populateAll()))
		})
		.then(map(o => ({ id: String(o._id), value: o.applyTemplates(0) })))
}

const updateModel = (Model, save, getPermissions) => {
	const get = getModel(Model, identity, getPermissions)
	return req =>
		get(req)
		.then(doc => getPermissions(req, doc)
			.then(({ editable }) => {
				if (!editable) {
					return Promise.reject(ClientError({ message: 'Permission refused' }))
				}
				// Update object
				Object.keys(req.body).forEach(field => {
					doc[field] = req.body[field]
				})
				// Sign for EditLogs
				doc.latestChangeBy = req.session.login
				return doc
			})
		)
		.then(doc => save(doc))
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
	o.latestChangeBy = req.session.login
	return save(o).then(saved => {
		res.status(201)
		return saved
	})
}

const deleteModel = (Model, getPermissions) => (req, res) =>
	Model.findById(req.params.id)
	.then(found => found || Promise.reject(NotFoundError({ title: Model.modelName })))
	.then(doc => getPermissions(req, doc)
		.then(({ editable }) => editable ? doc : Promise.reject(ClientError({ message: 'Permission refused' })))
	)
	.then(doc => {
		doc.latestChangeBy = req.session.login
		return doc.remove()
	})
	.then(() => {
		res.status(204)
		return null
	})

const searchModel = (esIndex, Model, format) => req => {
	const query = req.query.q || '*'
	const fields = req.query.fields ? req.query.fields.split(',') : undefined
	const full = Boolean(Number(req.query.full))
	const fuzzy = !Number(req.query.raw)

	return (fuzzy
			? es.q.forSuggestions(esIndex, { query, fields })
			: es.q(esIndex, { query_string: { query, fields } })
		)
		.then(map(o => full
			? format(o)
			: { value: o._id, label: applyTemplates(o, Model.modelName, 0) }
		))
}
