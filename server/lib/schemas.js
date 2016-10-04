'use strict'

const { Schema } = require('mongoose')
const metas = require('../../specs/schema.meta.json')
const enums = require('../../specs/schema.enums.json')
const { get } = require('lodash/fp')

const debug = require('debug')('isari:schema')
const chalk = require('chalk')


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
	// Schema fields
	'type',
	'enum',
	'ref',
	'regex',
	'default',
	'min',
	'max',
]

module.exports = {
	getSchema,
	RESERVED_FIELDS
}


// Get schema description from metadata
function getSchema (name) {
	const meta = metas[name]
	// Root description: every key is a field description here
	return Object.keys(meta).reduce(
		(schema, field) => Object.assign(schema, {
			[field]: getField(`${name}.${field}`, meta[field], meta)
		}),
		{}
	)
}

// Get schema for a field or sub-field…
function getField (name, meta, parentDesc) {
	debug(`${name}: Normal field`)

	const isArray = Array.isArray(meta)
	const desc = isArray ? meta[0] : meta

	// Field description, we expect some fields and ignore others
	// Other unknown field names will be treated as sub-fields
	let schema = {
		required: desc.requirement === 'mandatory'
	}

	// Check 'type'
	const type = desc.type || (desc.ref ? 'ref' : 'string')
	if (desc.ref && type !== 'ref') {
		throw Error(`${name}: Invalid type "${type}" conflicting with ref field`)
	}

	// Set Mongoose type
	if (type === 'string') {
		schema.type = String
	} else if (type === 'bool' || type === 'boolean') {
		schema.type = Boolean
	} else if (type === 'number') {
		schema.type = Number
	} else if (type === 'date') {
		// Special type date, not translated into Date because we want support for partial dates
		schema.year = Number
		schema.month = { type: Number, min: 1, max: 12 }
		schema.day = { type: Number, min: 1, max: 31 }
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
	if (typeof desc.enum === 'string') {
		// As a string: enums key or complex rule "KEYS(name)" or "name.$field"
		const matchKeys = desc.enum.match(/^KEYS\((.*)\)$/)
		const matchDot = desc.enum.match(/^(.*?)\.\$(.*)$/)
		const getKeys = !!matchKeys
		const getSubKey = !!matchDot
		const subKey = getSubKey ? matchDot[2] : null
		const enumName = getKeys ? matchKeys[1] : getSubKey ? matchDot[1] : desc.enum

		if (!enums[enumName]) {
			throw Error(`${name}: Unknown enum "${enumName}" (in "${desc.enum}")`)
		}

		if (subKey && !parentDesc[subKey]) {
			throw Error(`${name}: Unknown field "${subKey}" (required by enum "${desc.enum}"`)
		}

		if (getSubKey) {
			// Context-dependent enum validation: use a custom validator
			const getRefValue = get(subKey)
			// 'function' is used on purpose, "this" will be defined as the validated document
			// in case of sub-documents, it's the sub-document (not the root document)
			// we can go up using "this.parent()" (behavior not implemented in current schema DSL)
			const validator = function (value) {
				// Beware of 'runValidators' on update methods, as "this" will not be defined then
				// More info: http://mongoosejs.com/docs/api.html#schematype_SchemaType-validate
				if (!this) {
					process.stderr.write(chalk.yellow(`${name}: validator cannot be run in update context (enum "${desc.enum}")`))
					// Just pass
					return true
				}
				// Now the usual case
				const refValue = getRefValue(this)
				const allowedValues = enums[enumName][refValue]
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
			schema.enum = getKeys ? Object.keys(enums[enumName]) : enums[enumName]
		}
	} else if (Array.isArray(desc.enum)) {
		// As an array: direct values not exported into enums module
		schema.enum = desc.enum
	} else if (desc.enum) {
		throw Error(`${name}: Invalid enum value "${desc.enum}"`)
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

	// All other non-reserved fields are considered subfields
	Object.keys(desc).forEach(subField => {
		if (RESERVED_FIELDS.includes(subField)) {
			debug(`${name}: Reserved field ${subField}`)
			return
		} else if (subField.substring(0, 2) === '//') {
			debug(`${name}: Ignored comment field ${subField}`)
		} else {
			schema[subField] = getField(`${name}.${subField}`, desc[subField], desc)
		}
	})

	return isArray ? [schema] : schema
}
