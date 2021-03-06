'use strict'

const { Router } = require('express')
const { ClientError, NotFoundError } = require('./errors')
const { identity, set, map, pick, difference, get, reduce } = require('lodash/fp')
const bodyParser = require('body-parser')
const es = require('./elasticsearch')
const { applyTemplates, populateAllQuery } = require('./model-utils')
const debug = require('debug')('isari:rest')
const { requiresAuthentication, scopeOrganizationMiddleware } = require('./permissions')
const modelTemplates = require('../../specs/templates.models')
const removeEmptyFields = require('./remove-empty-fields')
const { getMeta, getVirtualColumn } = require('./specs')
const getIn = require('lodash/get')
const setIn = require('lodash/set')
const config = require('config')
const chalk = require('chalk')


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
			if (e.name === 'ValidationError' ) {
				err = new ClientError({ title: 'Validation error' })
				const info = extractMongooseValidationError(e)
				err.message = 'Erreurs de validation :\n' + Object.keys(info).map(k => `${k} : ${info[k]}`).join("\n")
			} else if (e.message.indexOf('duplicate key error') !==-1) {
				err = new ClientError({ title: 'Validation error' })
				const field = e.message.match(/index: (\w*?)_.+ /)[1]
				err.message = `La valeur du champs ${field} est déjà utilisée.`
			} else {
				err = e
			}
			return Promise.reject(err)
		})
}

const formatWithOpts = (req, format, getPermissions, applyTemplates) => o =>
	getPermissions(req, o).then(perms =>
		Promise.resolve(format(applyTemplates ? o.applyTemplates(req) : o, perms))
		.then(set('opts', { editable: perms.editable, deletable: perms.editable }))
	)

// buildListQuery can be a function returning an object { query: PromiseOfMongooseQuery } (embedding in an object to not accidentally convert query into a promise of Results)
exports.restRouter = (Model, format, getPermissions, buildListQuery = null) => {
	const save = saveDocument(format)
	const router = Router()

	const parseJson = bodyParser.json()

	const esIndex = config.collections[Model.modelName]
	if (esIndex) {
		router.get('/search', parseJson, requiresAuthentication, scopeOrganizationMiddleware, restHandler(searchModel(esIndex, Model, format, getPermissions)))
	}

	router.get('/', parseJson, requiresAuthentication, scopeOrganizationMiddleware, restHandler(listModel(Model, format, getPermissions, buildListQuery)))
	router.get('/:id([A-Za-f0-9]{24})/relations', parseJson, requiresAuthentication, scopeOrganizationMiddleware, restHandler(relationsModel(Model, getPermissions)))
	router.get('/:id([A-Za-f0-9]{24})', parseJson, requiresAuthentication, scopeOrganizationMiddleware, restHandler(getModel(Model, format, getPermissions)))
	router.get('/:ids([A-Za-f0-9,]+)/string', parseJson, requiresAuthentication, scopeOrganizationMiddleware, restHandler(getModelStrings(Model)))
	router.put('/:id([A-Za-f0-9]{24})', parseJson, requiresAuthentication, scopeOrganizationMiddleware, restHandler(replaceModel(Model, save, getPermissions)))
	router.post('/', parseJson, requiresAuthentication, scopeOrganizationMiddleware, restHandler(createModel(Model, save, getPermissions)))
	router.delete('/:id([A-Za-f0-9]{24})', parseJson, requiresAuthentication, scopeOrganizationMiddleware, restHandler(deleteModel(Model, getPermissions)))

	return router
}

const getVirtualColumns = reduce((vs, k) => {
	const f = getVirtualColumn(k)
	if (f) {
		vs[k] = f
	}
	return vs
}, {})

const mergeVirtuals = (virtuals, scope) => object => {
	object.virtuals = object.virtuals || {}

	for (let k in virtuals) {
		object.virtuals[k] = virtuals[k](object, scope)
	}

	return object
}

const listModel = (Model, format, getPermissions, buildListQuery = null) => req => {
	debug('List: start', req.originalUrl)
	// Always keep 'opts' technical field
	const selectFields = req.query.fields ? pick(req.query.fields.split(',').concat([ 'opts' ])) : identity
	const applyTemplates = Boolean(Number(req.query.applyTemplates))
	const formatOne = formatWithOpts(req, format, getPermissions, applyTemplates)
	const virtuals = req.query.fields && getVirtualColumns(req.query.fields.split(','))
	const addVirtuals = virtuals.length === 0 ? identity : mergeVirtuals(virtuals, req)
	// Note: we don't apply field selection directly in query as some fields may be not asked, but
	// required for some other fields' templates to be correctly calculated
	const withPopulate = q => (applyTemplates ? populateAllQuery(q, Model.modelName) : q).exec()
	const query = buildListQuery
		? buildListQuery(req).then(({ query }) => withPopulate(query))
		: withPopulate(Model.find())
	return query
		.then(data => { debug('List: Model.find', data.length + ' result(s)'); return data })
		.then(data => data.map(addVirtuals))
		.then(data => { debug('List: addVirtuals'); return data })
		.then(peoples => Promise.all(peoples.map(formatOne)))
		.then(data => { debug('List: formatWithOpts', applyTemplates); return data })
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

const relationsModel = (Model, getPermissions) => req => {

	// TODO: handle permissions for retrieved relations
	return Model.findById(req.params.id)
		.then(found => found || Promise.reject(NotFoundError({ title: Model.modelName })))
		.then(doc => getPermissions(req, doc).then(({ viewable }) => viewable ? doc : Promise.reject(ClientError({ status: 403, title: 'Permission refused' }))))
		.then(doc => Model.relationsById(doc._id))
		.then(relations => {
			for (const k in relations)
				relations[k] = relations[k].map(item => {
					return {
						id: item._id,
						label: modelTemplates[k](item.toObject())
					}
				})

			return relations
		})
}

// TODO Check permissions?
const getModelStrings = Model => req => {
	const ids = req.params.ids.split(',')
	const invalids = ids.filter(id => !id.match(/^[A-Za-f0-9]{24}$/))
	if (invalids.length > 0) {
		return Promise.reject(ClientError({ title: `Invalid ObjectId: ${invalids.join(', ')}` }))
	}
	return Model.find({ _id: { $in: ids } })
		.then(founds => {
			// checking missing ids as done here discard the whole bunch of strings where only one is missing. Not the good way..
			// canceling this test for prod hotfix 
			// const missing = difference(ids, map('id', founds))
			// if (missing.length > 0) {
			// 	return Promise.reject(NotFoundError({ title: `Model "${Model.modelName}" returned nothing for IDs ${missing.join(', ')}` }))
			// }
			// Map over ids instead of found object to keep initial order
			return Promise.all(ids.map(id => { 
				const i = founds.find(o => o.id === id)
				return i ? i.populateAll() : undefined
			}).filter(e => e))
		})
		.then(map(o => ({ id: String(o._id), value: o.applyTemplates(req,0) })))
}

const replaceModel = (Model, save, getPermissions) => {
	const get = getModel(Model, identity, getPermissions)
	return req => get(req).then(doc => getPermissions(req, doc).then(perms => {
		if (!perms.editable) {
			return Promise.reject(ClientError({ status: 403, message: 'Permission refused' }))
		}

		// TODO: the Shawarma knows what is bad here...

		// Apply diff to the original object
		let updated = doc.toObject()
		const diff = req.body.diff
		let toBeRemoved = []

		diff.forEach(operation => {
			debug('Applying diff operation', Model.modelName, operation)

			if (operation.type === 'update') {
				if (!('value' in operation) || operation.value === null || operation.value === '') {
					setIn(updated, operation.path, 'TO.BE.REMOVED')
					toBeRemoved.push(operation.path)
				}
				else {
					setIn(updated, operation.path, operation.value)
				}
			}
			else if (operation.type === 'delete') {
				getIn(updated, operation.path).splice(operation.index, 1)
			}
			else if (operation.type === 'push') {
				if (!getIn(updated, operation.path))
					setIn(updated, operation.path, [])

				getIn(updated, operation.path).push(removeEmptyFields(operation.value))
			}
			else if (operation.type === 'unshift') {
				if (!getIn(updated, operation.path))
					setIn(updated, operation.path, [])

				getIn(updated, operation.path).unshift(removeEmptyFields(operation.value))
			}
		})
		debug('updated', updated)
		toBeRemoved.forEach(pathToBeRemoved => {
			debug(pathToBeRemoved, updated[pathToBeRemoved])
			if (getIn(updated,  pathToBeRemoved)=== 'TO.BE.REMOVED')
				setIn(updated, pathToBeRemoved, undefined)
		})
		for (const f in updated) {
			//if (updated[f] === 'TO.BE.REMOVED') doc.set(f, undefined, {strict: false} )
			//else 
			doc[f] = updated[f]
		}

		// Delete
		doc.latestChangeBy = req.userId // sign for EditLogs
		debug('Save', Model.modelName, doc)
		return save(doc, perms)
	}))
}

const createModel = (Model, save, getPermissions) => (req, res) => Promise.resolve()
	.then(() => new Model(removeEmptyFields(req.body)))
	.then(doc => getPermissions(req, doc).then(perms => {
		doc.latestChangeBy = req.userId // sign for EditLogs
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

const deleteModel = (Model, getPermissions) => {
	return (req, res) => {
		return Model.findById(req.params.id)
		.then(found => found || Promise.reject(NotFoundError({ title: Model.modelName })))
		.then(doc => getPermissions(req, doc).then(({ editable }) => editable ? doc : Promise.reject(ClientError({ status: 403, message: 'Permission refused' }))))
		.then(doc => {
			return Promise.all([
				doc,
				Model.relationsById(req.params.id)
			])
		})
		.then(([doc, relations]) => {

			// We won't delete if there are relations
			const hasRelations = Object.keys(relations)
				.some(relatedModelname => relations[relatedModelname].length)

			if (hasRelations)
				return Promise.reject(ClientError({ status: 403, message: 'Target still has relations' }))

			doc.latestChangeBy = req.userId
			return doc.remove()
		})
		.then(() => {
			res.status(204)
			return null
		})
	}
}


// TODO apply permissions filter & co
// Examples:
// - /people/search?q=Bob
// - /organizations/search?q=FNSP&path=positions.0.organization&rootFeature=people
const searchModel = (esIndex, Model, format) => req => {
	const query = req.query.q || '*'
	const fields = req.query.fields ? req.query.fields.split(',') : undefined
	const full = Boolean(Number(req.query.full))
	const fuzzy = !Number(req.query.raw)

	// Check params
	if (fuzzy && req.query.path && !req.query.sourceModel && !req.query.rootFeature) {
		return Promise.reject(ClientError({ title: 'Fuzzy query with path but no sourceModel or rootFeature provided' }))
	}

	// Tweak suggestions depending on field info
	// Note: all these options
	let topX = null
	let topXField = null
	let topXIndex = null
	if (fuzzy && req.query.path && (req.query.sourceModel || req.query.rootFeature)) {
		const path = req.query.path
		const sourceModel = req.query.sourceModel || getModelFromFeature(req.query.rootFeature)
		if (!sourceModel) {
			return Promise.reject(ClientError({ title: 'Could not find Model from provided sourceModel or rootFeature' }))
		}

		const schema = getMeta(sourceModel)
		// path can have numbers for arrays, like 'positions.3.organization'
		// it's OK cause it means schema will be like { positions: [ { organization: … } ], … }
		// we just have to replace all of them as zero to match schema structure
		const fixedPath = path.replace(/\.\d+(\.|$)/g, '.0$1')
		const field = get(fixedPath, schema)
		// Got field description and it has suggestions info
		// !!RUSTINE!!: if query, we don't need topX
		if (query === '*' && field && field.suggestions) {
			// Is it a top_X suggestion?
			if (typeof field.suggestions === 'string' && field.suggestions.match(/^top_\d+$/)) {
				topX = Number(field.suggestions.substring(4))
				topXField = fixedPath.replace(/\.0(\.|$)/g, '$1')
				topXIndex = config.collections[sourceModel] // Do not request 'organization' index when we want the tops in 'people'
			}
		}
	}

	// We can't ask elasticsearch "give me the <esIndex>s matching <query>, sorted by most used value in <topXIndex>'s <path>"
	// We can only get matched items from esIndex on one hand, and the top used values on the other one,
	// then mix both to sort by most used value.
	// If top used values were supposed to match query BUT are placed after the <size> first results, they
	// will just disappear. So we have to use huge size for base query and slice after sorting by top used values.
	const resultSize = config.elasticsearch.defaultSize
	const size = topX ? config.elasticsearch.maxSize : resultSize

	const itemsP = fuzzy
		? es.q.forSuggestions({ type: esIndex, size, query, fields, includeInfo: true })
		: es.q({ type: esIndex, size, query: { query_string: { query, fields } } })

	const sortedItemsP = topX
		? es.q.top({ type: topXIndex, field: topXField, size: topX })
			.then(({ hits: ids }) => itemsP.then(items => {
				debug({ esIndex, topXIndex, topXField, topXHits: ids })
				// Top X first…
				const head = ids.map(id => items.find(({ _id }) => id === _id))
				// Exclude unmatched elements, if that happens, maxSize was too low or index is out of sync
				const filteredHead = head.filter(Boolean)
				if (items.length < size && filteredHead.length !== head.length) {
					console.warn(chalk.red(`${chalk.bold('WARNING')}: ES query returned elements unmatched by TopX query, you should increase elasticsearch.maxSize configuration option, or check indices are still well synced`)) // eslint-disable-line no-console
				}
				// … then standard results (only work on enough data, no need to browse the 5000 items now)
				const tail = items.slice(0, resultSize + filteredHead.length).filter(({ _id }) => !ids.includes(_id))
				return filteredHead.concat(tail)
			}))
		: itemsP

	return sortedItemsP
		.then(results => {
			if (results[0] && results[0]._score) {
				results.sort((a, b) => {
					if (a._score > b._score)
						return -1
					if (a._score < b._score)
						return 1
					return 0
				})
			}

			return results.slice(0, resultSize)
		})
		.then(map(o => full
			? format(o)
			: { value: o._id, label: applyTemplates(o, Model.modelName, req, 0) }
		))
}


const getModelFromFeature = feature =>
	Object.keys(config.collections).find(k => config.collections[k] === feature)
