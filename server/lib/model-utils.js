'use strict'

const templates = require('../../specs/templates')
const { getMeta } = require('./specs')
const { RESERVED_FIELDS } = require('./schemas')
const { get, clone, isObject, isArray } = require('lodash/fp')
const memoize = require('memoizee')
const { mongo } = require('mongoose')
const debug = require('debug')('isari:model')
const chalk = require('chalk')


module.exports = {
	applyTemplates,
	populateAll,
	populateAllQuery,
	format,
	filterConfidentialFields,
	mongoID,
}


// Helper to safely get a string from Mongoose instance, ObjectId, or direct string (populate-proof)
// Object|ObjectID|String => String
function mongoID (o) {
	return (o instanceof mongo.ObjectID) ? o.toHexString() : (o ? (o.id ? o.id : (o._id ? o._id.toHexString() : o)) : null)
}

const getRefFields = memoize((meta, depth) => _getRefFields('', meta, depth))


function applyTemplates (object, name, depth = 0) {
	const meta = getMeta(name)
	return _applyTemplates(object, meta, depth)
}

function _applyTemplates (object, meta, depth) {
	if (Array.isArray(meta)) {
		if (!Array.isArray(object)) {
			throw new Error('Model inconsistency: meta declares array field, object is not an array')
		}
		return object.map(o => _applyTemplates(o, meta[0], depth))
	}
	if (!object) {
		return object
	}
	if (typeof object !== 'object') {
		return String(object)
	}
	if (!meta.template) {
		return null
	}

	if (!templates[meta.template]) {
		throw new Error(`Unknown template ${meta.template}`)
	}

	const string = templates[meta.template](object)

	// No depth: simple string representation
	if (depth === 0) {
		return string
	}

	// Depth: generate string representations for fields
	let result = {
		// _string: string // TODO maybe include self-representation too?
	}
	const fields = Object.keys(meta).filter(f => !RESERVED_FIELDS.includes(f) && f[0] !== '/')

	fields.forEach(f => result[f] = _applyTemplates(object[f], meta[f], depth - 1))

	result._id = object._id

	return result
}

// One pass only when done from query
function populateAllQuery (query, name, depth = Math.Infinity) {
	let meta = getMeta(name)

	if (Array.isArray(meta)) {
		meta = meta[0]
	}

	const populates = getRefFields(meta, depth)
	const fields = Object.keys(populates)

	return fields.length > 0 ? query.populate(fields.join(' ')) : query
}

function populateAll (object, name, depth = Math.Infinity, passes = 1) {
	const meta = getMeta(name)
	return _populateAll(object, meta, depth, passes)
}

function _populateAll (object, meta, depth, passes) {
	if (Array.isArray(meta)) {
		meta = meta[0]
	}
	if (!object) {
		return null
	}

	const populates = getRefFields(meta, depth)
	const fields = Object.keys(populates)

	const populated = fields.length > 0
		? object.populate(fields.join(' ')).execPopulate()
		: Promise.resolve(object)

	if (passes > 1) {
		return populated.then(o => Promise.all(fields.map(f => populateAll(get(f, o), populates[f], depth, passes - 1))).then(() => o))
	} else {
		return populated
	}
}

function _getRefFields (baseName, meta, depth) {
	if (depth === 0) {
		return []
	}
	if (Array.isArray(meta)) {
		meta = meta[0]
	}

	const fields = Object.keys(meta).filter(f => !RESERVED_FIELDS.includes(f) && f[0] !== '/')
	const refFields = fields.filter(f => meta[f].ref)
	const notRefFields = fields.filter(f => !meta[f].ref)

	let result = {}
	refFields.forEach(f => result[baseName ? (baseName + '.' + f) : f] = meta[f].ref)
	notRefFields.forEach(f => Object.assign(result, _getRefFields(baseName ? (baseName + '.' + f) : f, meta[f], depth - 1)))

	return result
}

const pathToRegExp = memoize(path => new RegExp('^' + path.replace('.', '\\.').replace('.*', '..+') + '$'))

const pathsTester = paths => {
	const res = paths.map(pathToRegExp)
	return path => res.some(re => re.test(path))
}

const retFalse = () => false

const REMOVED_FIELD = Symbol()

function filterConfidentialFields (modelName, object, perms) {
	const shouldRemove = perms.confidentials.viewable ? retFalse : pathsTester(perms && perms.confidentials && perms.confidentials.paths || [])
	return _format(object, getMeta(modelName), shouldRemove, '', false)
}

function format (modelName, object, perms) {
	const shouldRemove = perms.confidentials.viewable ? retFalse : pathsTester(perms && perms.confidentials && perms.confidentials.paths || [])
	try {
		return _format(object, getMeta(modelName), shouldRemove, '', true, modelName + '#' + (object && object.id))
	} catch (err) {
		debug('Failed formatting', err.message, object)
		throw err
	}
}

function _format (object, schema, shouldRemove, path, transform, rootDescription) {
	try {
		const keepId = path === ''

		// Confidential not-viewable field: remove from output
		if (shouldRemove(path)) {
			return REMOVED_FIELD
		}

		// Multi-valued field: format recursively
		if (isArray(object)) {
			if (schema && !isArray(schema)) {
				throw new Error('Schema Inconsistency: Array expected')
			}
			if (shouldRemove(path + '.*')) {
				// Multiple field marked as confidential: should remove whole array
				return REMOVED_FIELD
			}
			return object.map((o, i) => _format(o, schema && schema[0], shouldRemove, path ? path + '.' + i : String(i), transform, rootDescription))
		}

		// Scalar value? Nothing to format
		if (!isObject(object)) {
			if (schema && schema.type === 'object') {
				throw new Error('Schema Inconsistency: Object expected')
			}
			return object
		}

		if (object instanceof mongo.ObjectID) {
			return String(object)
		}

		// Work on a POJO: formatting must have no side-effect
		let o = transform ? (object.toObject ? object.toObject() : clone(object)) : object

		// Keep ID for later use (if keepId is set)
		const id = o._id

		// Extranous field: ignore it, but with a warning!
		if (!schema) {
			// TODO use proper logger
			console.error(chalk.red(`${chalk.bold('Extraneous field')} in object ${rootDescription}: ${path}`)) // eslint-disable-line no-console
			return REMOVED_FIELD // Force ignore
		}

		// Format each sub-element recursively
		Object.keys(o).forEach(f => {
			if (f.substring(0, 3) === '$__') {
				// Mongoose internal cache: ignore, thank you Mongoose for your biiiiiig semver respect
				return
			}
			if (f[0] === '_' || f === 'id') { // Since mongoose 4.6 ObjectIds have a method toObject() returning { _bsontype, id } object
				if (transform) {
					delete o[f]
				}
				// Technical field: ignore
				return
			}
			// If the value is a ref to another model, grab schema and format accordingly
			const ref = schema && schema[f] && schema[f].ref

			// unpopulate all the things (even when format = false)
			if (ref) {
				o[f] = mongoID(o[f])
			} else {
				const res = _format(o[f], schema[f], shouldRemove, path ? path + '.' + f : f, transform, rootDescription)
				if (res !== REMOVED_FIELD) {
					o[f] = res
				}
			}
		})

		// Keep ID
		if (transform && id && keepId) {
			o.id = String(id)
		}

		return o
	} catch (err) {
		err.message = '[' + path + '] ' + err.message
		throw err
	}
}
