'use strict'

const { Schema } = require('mongoose')
const enums = require('../../specs/enums.json')
const { get, map, filter, identity } = require('lodash/fp')
const { getMeta } = require('./specs')
const memoize = require('memoizee')

// TODO use proper logger
const debug = require('debug')('isari:schema')
const chalk = require('chalk')
const util = require('util')


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
	// Schema fields
	'type',
	'enum',
	'ref',
	'regex',
	'default',
	'min',
	'max',
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
	'multiple'
]

module.exports = {
	getMongooseSchema: memoize(getMongooseSchema),
	getFrontSchema: memoize(getFrontSchema),
	RESERVED_FIELDS,
	FRONT_KEPT_FIELDS
}


const extractValue = map('value')
const removeEmpty = filter(identity)

// Get schema description from metadata
function getMongooseSchema (name) {
	const meta = getMeta(name)
	if (!meta) {
		throw Error(`${name}: Unknonwn schema`)
	}

	return getField(name, meta, meta)
}

// Get schema for a field or sub-field…
function getField (name, meta, parentDesc, rootDesc = null) {
	debug(`${name}: Normal field`)

	const isArray = Array.isArray(meta)
	const desc = isArray ? meta[0] : meta

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
	let schema = {}

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
		schema.match = /^[12][0-9]{3}(?:-(?:0?[1-9]|1[0-2]))?(?:-(?:0?[1-9]|[12]\d|3[01]))?$/
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
	if (typeof desc.enum === 'string') {
		// As a string: enums key or complex rule "KEYS(name)" or "name.$field"
		const matchKeys = desc.enum.match(/^KEYS\((.*)\)$/)
		const matchDot = desc.enum.match(/^(.*?)\.\$(.*)$/)
		const getKeys = !!matchKeys
		const getSubKey = !!matchDot
		const subKey = getSubKey ? matchDot[2] : null
		const enumName = getKeys ? matchKeys[1] : getSubKey ? matchDot[1] : desc.enum

		const values = getEnumValues(enumName)
		if (!values) {
			throw Error(`${name}: Unknown enum "${enumName}" (in "${desc.enum}")`)
		}

		if (subKey && !parentDesc[subKey]) {
			throw Error(`${name}: Unknown field "${subKey}" (required by enum "${desc.enum}"`)
		}

		if (getSubKey) {
			// Context-dependent enum validation: use a custom validator
			if (typeof values !== 'object') {
				throw Error(`${name}: context-dependent enum must be an object (in "${desc.enum}")`)
			}
			const getRefValue = get(subKey)
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
				const refValue = getRefValue(this)
				const allowedValues = values[refValue]
				if (!Array.isArray(allowedValues)) {
					process.stderr.write(chalk.yellow(`${name}: no values found for enum ${enumName}.${refValue}`))
					return false
				}
				return allowedValues.includes(value)
			}
			const message = `{PATH} does not allow "{VALUE}" as of enum "${desc.enum}"`
			schema.validate = { validator, message }
		} else {
			// Use basic enum validation
			schema.enum = getKeys ? Object.keys(values) : values
		}
	} else if (Array.isArray(desc.enum)) {
		// As an array: direct values not exported into enums module
		schema.enum = getEnumValues(desc.enum)
	} else if (desc.enum) {
		throw Error(`${name}: Invalid enum value "${desc.enum}"`)
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
	['default', 'min', 'max'].forEach(k => {
		if (desc[k]) {
			schema[k] = desc[k]
		}
	})

	return isArray ? [schema] : schema
}

function getEnumValues (zenum) {
	if (typeof zenum === 'string') {
		return getEnumValues(enums[zenum])
	}

	if (Array.isArray(zenum) && typeof zenum[0] === 'object') {
		// Array of object, grab 'value' field
		return removeEmpty(extractValue(zenum))
	} else {
		// Array of string or object, keep as-is
		return zenum
	}
}


// Formatting for frontend APIs
function getFrontSchema (name, options = {}) {
	const meta = getMeta(name)

	return meta && formatMeta(meta, options)
}

function formatMeta (meta, options = {}) {
	const { admin = false } = options

	const multiple = Array.isArray(meta)
	const desc = multiple ? meta[0] : meta
	let isObject = false

	const handleField = (result, name) => {
		if (name.substring(0, 2) === '//') {
			return false // Skipped comment field
		}

		if (!result) {
			return result // Skipped field
		}

		if (!RESERVED_FIELDS.includes(name)) {
			// Sub-field: just include it
			isObject = true
			const subres = formatMeta(desc[name], options)
			if (subres) {
				result[name] = subres
			}
		}

		// Access type defines if we can see this field
		else if (name === 'accessType' && !admin) {
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
