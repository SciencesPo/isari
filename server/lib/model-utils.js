'use strict'

const templates = require('../../specs/templates')
const { getMeta } = require('./specs')
const { RESERVED_FIELDS } = require('./schemas')
const { difference, get, clone, isObject, isArray } = require('lodash/fp')


module.exports = {
	applyTemplates,
	populateAll,
	format
}


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

	const populates = getRefFields('', object, meta, depth)
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

function getRefFields (baseName, object, meta, depth) {
	if (depth === 0 || !object) {
		return []
	}
	if (Array.isArray(meta)) {
		meta = meta[0]
	}

	const fields = Object.keys(meta).filter(f => !RESERVED_FIELDS.includes(f) && f[0] !== '/')
	const refFields = fields.filter(f => meta[f].ref)

	let result = {}
	refFields.filter(f => !object.populated(f)).forEach(f => result[baseName ? (baseName + '.' + f) : f] = meta[f].ref)
	difference(fields, refFields).forEach(f => Object.assign(result, getRefFields(baseName ? (baseName + '.' + f) : f, object, meta[f], depth - 1)))

	return result
}


function format (modelName, object) {
	return _format(object, getMeta(modelName), true)
}

function _format (object, schema, keepId) {
	// Multi-valued field: format recursively
	if (isArray(object)) {
		if (schema && !isArray(schema)) {
			throw new Error('Schema Inconsistency: Array expected')
		}
		return object.map(o => _format(o, schema && schema[0], keepId))
	}

	// Scalar value? Nothing to format
	if (!isObject(object)) {
		if (schema && schema.type === 'object') {
			throw new Error('Schema Inconsistency: Object expected')
		}
		return object
	}

	// Work on a POJO: formatting must have no side-effect
	let o = object.toObject ? object.toObject() : clone(object)

	// Keep ID for later use (if keepId is set)
	const id = o._id

	// Remove Mongoose technical fields
	delete o._id
	delete o.__v
	delete o._bsontype

	// Format each sub-element recursively
	Object.keys(o).forEach(f => {
		// If the value is a ref to another model, grab schema and format accordingly
		const ref = schema && schema[f] && schema[f].ref
		const s = ref ? getMeta(ref) : schema ? schema[f] : null
		// If ref has been populated, it will return a properly formatted object
		// If ref has not been populated, it's just a string, left untouched
		// If not a ref, formatting just goes on
		// Note: keepId only for refs, ids in arrays of sub-docs can be dropped
		o[f] = _format(o[f], s, Boolean(ref))
	})

	// Keep ID
	if (id && keepId) {
		o.id = String(id)
	}

	return o
}
