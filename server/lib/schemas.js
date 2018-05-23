'use strict'

const { Schema } = require('mongoose')
const { map, isArray } = require('lodash/fp')
const { getMeta } = require('./specs')
const memoize = require('memoizee')
const { enumValueGetter } = require('./enums')

// TODO use proper logger
const debug = require('debug')('isari:schema')
const chalk = require('chalk')
const util = require('util')


const EXTRA_FIELDS = [
	'latestChangeBy',
	'updatedAt',
	'createdAt',
	'save',
	'validate',
	'remove'
]

const RESERVED_FIELDS = [
	// Isari fields
	'accessType',
	'label',
	'requirement',
	'accessMonitoring',
	'suggestions',
	'description',
	'comment',
	'service',
	'softenum',
	'template',
	'step',
	// Schema fields
	'type',
	'enum',
	'ref',
	'regex',
	'default',
	'min',
	'max',
	'index',
	'unique',
	'sparse',
	// Additional generated technical fields
	'multiple'
]

const FRONT_KEPT_FIELDS = [
	'label',
	'requirement',
	'suggestions',
	'description',
	'type',
	'ref',
	'enum',
	'softenum',
	'default',
	'min',
	'max',
	'regex',
	'multiple',
	'step',
	'accessMonitoring'
]

module.exports = {
	getMongooseSchema: memoize(getMongooseSchema),
	getFrontSchema: memoize(getFrontSchema, { length: 2 }),
	computeConfidentialPaths: memoize(computeConfidentialPaths),
	getAccessMonitoringPaths: memoize(getAccessMonitoringPaths, { length: 2 }),
	RESERVED_FIELDS,
	FRONT_KEPT_FIELDS,
	EXTRA_FIELDS
}


// Get schema description from metadata
function getMongooseSchema (name) {
	const meta = getMeta(name)
	if (!meta) {
		throw Error(`${name}: Unknonwn schema`)
	}

	const schema = getField(name, meta, meta)

	// Re-enable automatic _id for root document schema
	delete schema._id

	return schema
}

// Get schema for a field or sub-field…
function getField (name, meta, parentDesc, rootDesc = null) {
	debug(`${name}: Normal field`)

	const isArray = Array.isArray(meta)
	const desc = fixNestedEnumPath(isArray ? meta[0] : meta, false)

	// All non-reserved fields are considered subfields
	const subFields = Object.keys(desc).filter(subField => {
		if (RESERVED_FIELDS.includes(subField)) {
			debug(`${name}: Reserved field ${subField}`)
			return false
		} else if (subField.substring(0, 2) === '//') {
			debug(`${name}: Ignored comment field ${subField}`)
			return false
		} else {
			return true
		}
	})
	const isDocument = subFields.length > 0

	// A pointer to root desc is required as we'll store some additional information like hooks
	if (!rootDesc) {
		rootDesc = desc
	}

	// Field description, we expect some fields and ignore others
	// Other unknown field names will be treated as sub-fields
	// NOTE: dropping nested schema _id generation
	let schema = {_id: false}

	// If it's a document, do not set "type", "required", or any other field-related configuration
	// Just define sub-fields and finish
	if (isDocument) {
		subFields.forEach(subField => {
			schema[subField] = getField(`${name}.${subField}`, desc[subField], desc)
		})
		return isArray ? [schema] : schema
	}

	// Check 'type'
	const type = desc.type || (desc.ref ? 'ref' : 'string')
	if (desc.ref && type !== 'ref') {
		throw Error(`${name}: Invalid type "${type}" conflicting with ref field`)
	}

	// Required?
	schema.required = desc.requirement === 'mandatory'

	// Set Mongoose type
	if (type === 'string' || type === 'text') {
		schema.type = String
	} else if (type === 'bool' || type === 'boolean') {
		schema.type = Boolean
	} else if (type === 'number') {
		schema.type = Number
	} else if (type === 'date') {
		// Special type date, not translated into Date because we want support for partial dates
		schema.type = String
		// Ensure leading zeros are always here
		schema.match = /^[12][0-9]{3}(?:-(?:0[1-9]|1[0-2]))?(?:-(?:0[1-9]|[12][0-9]|3[01]))?$/
		// transform if data is given, but allow undefined #403
		schema.set = s => s ? s.replace(/^([12][0-9]{3})(?:-(0?[1-9]|1[0-2]))?(?:-(0?[1-9]|[12]\d|3[01]))?$/, (ymd, y, m, d) => y + (m ? m.length === 1 ? '-0' + m : '-' + m : '') + (d ? d.length === 1 ? '-0' + d : '-' + d : '')) : s
	} else if (type === 'ref') {
		schema.type = Schema.Types.ObjectId
		if (!desc.ref) {
			throw Error(`${name}: No ref defined for a ref field`)
		}
		schema.ref = desc.ref
	} else if (type === 'email') {
		schema.type = String
		schema.match = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
	} else {
		throw Error(`${name}: Unknown type "${type}"`)
	}

	// Validation rule: enum
	// Note: softenum does not come with any validation, it's only about suggestions
	if (desc.enum) {
		try {
			const getEnumValue = enumValueGetter(desc.enum)
			// 'function' is used on purpose, "this" will be defined as the validated document
			// in case of sub-documents, it's the sub-document (not the root document)
			// we can go up using "this.parent()" (behavior not implemented in current schema DSL)
			const validator = function (value) {
				// Allow empty value?
				if (!schema.required && !value) {
					return true
				}

				// Beware of 'runValidators' on update methods, as "this" will not be defined then
				// More info: http://mongoosejs.com/docs/api.html#schematype_SchemaType-validate
				if (!this) {
					process.stderr.write(chalk.yellow(`${name}: validator cannot be run in update context (enum "${desc.enum}")`))
					// Just pass
					return true
				}

				// Now the usual case
				const found = getEnumValue(value, this)
				return Boolean(found)
			}
			const message = `{PATH} does not allow "{VALUE}" as of enum "${desc.enum}"`
			schema.validate = { validator, message }
		} catch (e) {
			e.message = `${name}: ${e.message}`
			throw e
		}
	}

	// Basic enum validation set? Add support for empty values if field is not required
	if (schema.enum && !schema.required) {
		schema.enum = schema.enum.slice().concat([ '', null ])
	}

	// Validation rule: regex
	if (desc.regex) {
		schema.match = new RegExp(desc.regex)
	}

	// Simple fields that need no translation
	['default', 'min', 'max', 'index', 'unique', 'sparse'].forEach(k => {
		if (desc[k]) {
			schema[k] = desc[k]
		}
	})

	return isArray ? [schema] : schema
}


// Formatting for frontend APIs
function getFrontSchema (name, includeRestricted = false) {
	const meta = getMeta(name)

	return meta && formatMeta(meta, includeRestricted)
}

function formatMeta (meta, includeRestricted = false) {
	const multiple = Array.isArray(meta)
	const desc = fixNestedEnumPath(multiple ? meta[0] : meta, true)
	let isObject = false

	const handleField = (result, name) => {
		if (!result) {
			return result // Skipped field
		}

		if (name.substring(0, 2) === '//') {
			return false // Skipped comment field
		}

		if (!RESERVED_FIELDS.includes(name)) {
			// Sub-field: just include it
			isObject = true
			const subres = formatMeta(desc[name], includeRestricted)
			if (subres) {
				result[name] = subres
			}
		}

		// Access type defines if we can see this field
		else if (name === 'accessType' && desc.accessType === 'confidential' && !includeRestricted) {
			result = null // Skip the field
		}

		// Field kept as-is
		else if (FRONT_KEPT_FIELDS.includes(name)) {
			result[name] = desc[name]
		}

		// Other reserved fields are skipped

		return result
	}

	let result = Object.keys(desc).reduce(handleField, {})
	if (!result) {
		// Skip this field
		return result
	}

	if (isObject) {
		if (result.type) {
			process.stderr.write(chalk.yellow(`\n[WARN] type "${result.type}" defined on an object document?\n`))
			process.stderr.write(util.inspect(result, { colors: true }))
		}
		result.type = 'object'
	}

	if (!result.type) {
		result.type = 'string'
	}

	// Handle multi-valued fields
	if (multiple) {
		result.multiple = true
	}

	return result
}

function computeConfidentialPaths (name) {
	return filterPaths(name, desc => desc.accessType === 'confidential')
}

function getAccessMonitoringPaths (name, monitoring = true) {
	if (monitoring !== true) {
		// We want all paths monitored with accessMonitoring = x
		const paths = filterPaths(name, desc => desc.accessMonitoring === monitoring)
		// In this case, we're not interested in patterns but in prefixes
		// Let's replace all X.* by single X
		return paths.map(p => p.replace(/\.\*/g, ''))
	} else {
		// We want all monitored paths, and know which is their AccessMonitoring value
		let result = {}
		filterPaths(name, (desc, path) => {
			if (desc.accessMonitoring) {
				// In this case, we're not interested in patterns but in prefixes
				// Let's replace all X.* by single X
				result[path.replace(/\.\*/g, '')] = desc.accessMonitoring
			}
		})
		return result
	}
}

function filterPaths (name, test) {
	const meta = getMeta(name)
	if (!meta) {
		throw Error(`${name}: Unknonwn schema`)
	}

	return _filterPaths(test, meta, '')
}

function _filterPaths (test, desc, currPath = '') {
	if (isArray(desc)) {
		return _filterPaths(test, desc[0], currPath + '.*')
	}
	const unprefixedPath = currPath.substring(1)
	const result = test(desc, unprefixedPath) ? [ unprefixedPath ] : []
	return Object.keys(desc).reduce((result, field) => {
		if (RESERVED_FIELDS.includes(field) || field.substring(0, 2) === '//') {
			return result
		}
		return result.concat(_filterPaths(test, desc[field], currPath + '.' + field))
	}, result)
}

const fixNestedEnumPath = (desc, frontend = false) =>
	_fixNestedEnumPath(_fixNestedEnumPath(desc, 'enum', frontend), 'softenum', frontend)

const _fixNestedEnumPath = (desc, k, frontend) => {
	if (!desc[k]) {
		return desc
	}
	if (typeof desc[k] !== 'string') {
		return desc
	}
	if (desc[k].indexOf(':') === -1) {
		return desc
	}

	const [ enumName, path ] = desc[k].split(':')
	let newPath = path

	if (frontend) {
		// Nested enum "enumName:path"
		// Paths are made for server, but client understands them layer by layer:
		// - One ".." to get from field to object (we can always skip this one)
		// - One ".." to get from object to array of object (we can skip this one too)
		// - Next ".." to really get to parent object
		// object.parent() will get to the parent object directly, which means:
		// - First ".." can always be skipped
		// - Second ".." can be skipped only when we have an array of children
		// Right now, we'll just replace every ".." by "../.." and prepend with "../", as we don't have any other case than
		// { parentField: ..., children: [ { childField: { enum: "../parentField" } } ] }
		newPath = '../' + path.replace(/\.\.\//g, '../../')
	}

	// "./" can be added for legibility (and easier search/replace), but
	// it's just neutral and should be removed from final result
	newPath = newPath.replace(/(^|[^\.])\.\//g, '$1')

	return Object.assign({}, desc, { [k]: enumName + ':' + newPath })
}
