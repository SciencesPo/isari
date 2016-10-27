'use strict'

const templates = require('../../specs/templates')
const { getMeta } = require('./specs')
const { RESERVED_FIELDS } = require('./schemas')
const { difference, get } = require('lodash/fp')


module.exports = {
	applyTemplates,
	populateAll
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
	const fields = Object.keys(meta).filter(f => !RESERVED_FIELDS.includes(f))

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

	const fields = Object.keys(meta).filter(f => !RESERVED_FIELDS.includes(f))
	const refFields = fields.filter(f => meta[f].ref)

	let result = {}
	refFields.filter(f => !object.populated(f)).forEach(f => result[baseName ? (baseName + '.' + f) : f] = meta[f].ref)
	difference(fields, refFields).forEach(f => Object.assign(result, getRefFields(baseName ? (baseName + '.' + f) : f, object, meta[f], depth - 1)))

	return result
}
