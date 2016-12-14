'use strict'

const { Router } = require('express')
const { ClientError, NotFoundError } = require('./errors')
const { identity, set, map, pick, difference } = require('lodash/fp')
const bodyParser = require('body-parser')
const es = require('./elasticsearch')
const { applyTemplates, populateAllQuery, filterConfidentialFields } = require('./model-utils')
const debug = require('debug')('isari:rest')
const { requiresAuthentication, scopeOrganizationMiddleware } = require('./permissions')
const removeEmptyFields = require('./remove-empty-fields')


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

const saveDocument = format => (doc, perms) => {
	return doc.save()
		.then(doc => format(doc, perms))
		.then(removeEmptyFields)
		.catch(e => {
			let err
			if (e.name === 'ValidationError') {
				err = new ClientError({ title: 'Validation error' })
				err.errors = extractMongooseValidationError(e)
			} else {
				err = e
			}
			return Promise.reject(err)
		})
}

const formatWithOpts = (req, format, getPermissions, applyTemplates) => o =>
	getPermissions(req, o).then(perms =>
		Promise.resolve(format(applyTemplates ? o.applyTemplates() : o, perms))
		.then(set('opts', { editable: perms.editable }))
	)

// buildListQuery can be a function returning an object { query: PromiseOfMongooseQuery } (embedding in an object to not accidentally convert query into a promise of Results)
exports.restRouter = (Model, format, esIndex, getPermissions, buildListQuery = null) => {
	const save = saveDocument(format)
	const router = Router()

	const parseJson = bodyParser.json()

	if (esIndex) {
		router.get('/search', parseJson, requiresAuthentication, scopeOrganizationMiddleware, restHandler(searchModel(esIndex, Model, format, getPermissions)))
	}

	router.get('/', parseJson, requiresAuthentication, scopeOrganizationMiddleware, restHandler(listModel(Model, format, getPermissions, buildListQuery)))
	router.get('/:id([A-Za-f0-9]{24})', parseJson, requiresAuthentication, scopeOrganizationMiddleware, restHandler(getModel(Model, format, getPermissions)))
	router.get('/:ids([A-Za-f0-9,]+)/string', parseJson, requiresAuthentication, scopeOrganizationMiddleware, restHandler(getModelStrings(Model)))
	router.put('/:id([A-Za-f0-9]{24})', parseJson, requiresAuthentication, scopeOrganizationMiddleware, restHandler(replaceModel(Model, save, getPermissions)))
	router.post('/', parseJson, requiresAuthentication, scopeOrganizationMiddleware, restHandler(createModel(Model, save, getPermissions)))
	router.delete('/:id([A-Za-f0-9]{24})', parseJson, requiresAuthentication, scopeOrganizationMiddleware, restHandler(deleteModel(Model, getPermissions)))

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
		.then(removeEmptyFields)
		.then(data => { debug('List: removeEmptyFields'); return data })
}

const getModel = (Model, format, getPermissions) => req =>
	Model.findById(req.params.id)
	.then(found => found || Promise.reject(NotFoundError({ title: Model.modelName })))
	.then(doc => getPermissions(req, doc).then(({ viewable }) => viewable ? doc : Promise.reject(ClientError({ status: 403, title: 'Permission refused' }))))
	.then(formatWithOpts(req, format, getPermissions, false))
	.then(removeEmptyFields)

// TODO Check permissions?
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

const replaceModel = (Model, save, getPermissions) => {
	const get = getModel(Model, identity, getPermissions)
	return req => get(req).then(doc => getPermissions(req, doc).then(perms => {
		if (!perms.editable) {
			return Promise.reject(ClientError({ status: 403, message: 'Permission refused' }))
		}
		// Build original values and new values, ignoring confidential fields
		const original = filterConfidentialFields(Model.modelName, doc.toObject(), perms)
		const updated = filterConfidentialFields(Model.modelName, removeEmptyFields(req.body), perms)
		// Update with provided data
		for (let f in updated) {
			if (f === 'id' || f[0] === '_') {
				continue // just in case client sent technical data
			}
			debug('Update', Model.modelName, doc.id, f, updated[f])
			doc[f] = updated[f]
		}
		// Also delete fields that are in 'original' but not in 'updated' anymore
		for (let f in original) {
			if (f !== 'id' && f[0] !== '_' && !(f in updated)) {
				debug('Remove', Model.modelName, doc.id, f)
				doc[f] = undefined
			}
		}
		// Delete
		doc.latestChangeBy = req.session.login // sign for EditLogs
		debug('Save', Model.modelName, doc)
		return save(doc, perms)
	}))
}

const createModel = (Model, save, getPermissions) => (req, res) => Promise.resolve()
	.then(() => new Model(req.body))
	.then(doc => getPermissions(req, doc).then(perms => {
		doc = filterConfidentialFields(Model.modelName, doc, perms)
		doc.latestChangeBy = req.session.login // sign for EditLogs
		return save(doc, perms)
	}))
	.then(saved => {
		res.status(201)
		return saved
	})
	.catch(e => {
		if (e.name === 'StrictModeError') {
			// Extra fields
			return Promise.reject(ClientError({ title: e.message }))
		} else {
			return Promise.reject(e)
		}
	})

const deleteModel = (Model, getPermissions) => (req, res) =>
	Model.findById(req.params.id)
	.then(found => found || Promise.reject(NotFoundError({ title: Model.modelName })))
	.then(doc => getPermissions(req, doc).then(({ editable }) => editable ? doc : Promise.reject(ClientError({ status: 403, message: 'Permission refused' }))))
	.then(doc => {
		doc.latestChangeBy = req.session.login
		return doc.remove()
	})
	.then(() => {
		res.status(204)
		return null
	})

// TODO apply permissions filter & co
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
