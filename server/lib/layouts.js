'use strict'

const { getFrontSchema, RESERVED_FIELDS, FRONT_KEPT_FIELDS } = require('./schemas')
const { readdirSync } = require('fs')
const path = require('path')
const { pick, merge, map, difference, isArray, isObject, isString, flatten } = require('lodash/fp')
const util = require('util')
const memoize = require('memoizee')


module.exports = {
	getLayout: (name, includeRestricted) => getLayout(name.toLowerCase(), Boolean(includeRestricted))
}

const getLayout = memoize((name, includeRestricted) => {
	const restrictedSchema = getFrontSchema(name, includeRestricted)
	const unrestrictedSchema = includeRestricted ? restrictedSchema : getFrontSchema(name, true)
	return _getLayout(name, restrictedSchema, unrestrictedSchema)
})


// At startup, simply load all layouts
// TODO make it more dynamic?
const root = path.join(__dirname, '..', '..', 'specs')
const layouts = readLayoutJSONs()


function readLayoutJSONs () {
	return readdirSync(root)
		.filter(f => f.substring(0, 7) === 'layout.')
		.reduce((o, f) => {
			const key = f.substring(7, f.length - 5)
			const data = require(path.join(root, f))
			return Object.assign(o, { [key.toLowerCase()]: data })
		}, {})
}

const _getLayout = (name, schema, fullSchema) => {
	if (!schema) {
		return null
	}
	const rows = (layouts[name.toLowerCase()] || []).map(getRow(name, schema, fullSchema))
	const rowsFields = flatten(rows.map(row => map('name', row.fields)))
	const expectedFields = Object.keys(schema).filter(f => !RESERVED_FIELDS.includes(f) && f[0] !== '/')
	const missingFields = difference(expectedFields, rowsFields)
	return rows.concat(missingFields.map(getRow(name, schema, fullSchema)))
		// Ignored fields
		.map(row => Object.assign(row, {
			fields: row.fields.filter(field => !field.ignored) // Remove ignored fields
		}))
		.filter(row => row.fields.length > 0) // Remove empty rows
}

const getRow = (name, schema, fullSchema) => row => {
	if (isArray(row)) {
		return getRowArray(name, schema, fullSchema, row)
	} else if (isObject(row)) {
		return getRowObject(name, schema, fullSchema, row)
	} else if (isString(row)) {
		return getRowString(name, schema, fullSchema, row)
	} else {
		throw Error(`${name}: invalid type for layout row description (expects array, object or string, got ${util.inspect(row)}`)
	}
}

const getRowString = (baseName, schema, fullSchema, row) => getRowArray(baseName, schema, fullSchema, [row])

const getRowArray = (baseName, schema, fullSchema, fields) => getRowObject(baseName, schema, fullSchema, {
	// no label
	// not collapsable
	fields
})

const getRowObject = (baseName, schema, fullSchema, row) => merge(
	pick([ 'label', 'collapsabled' ].concat(FRONT_KEPT_FIELDS), row),
	{
		fields: row.fields.map(getFieldsDescription(baseName, schema, fullSchema))
	}
)

const getFieldsDescription = (baseName, schema, fullSchema) => name => {
	if (Array.isArray(name)) {
		return getRowArray(baseName, schema, fullSchema, name)
	}

	if (name[0] === '-' || (!schema[name] && fullSchema[name] /* confidential */)) {
		return {
			name: name.substring(1),
			ignored: true
		}
	}

	const fieldSchema = schema[name]
	if (!fieldSchema) {
		throw Error(`${baseName}.${name}: Unknown schema while trying to build layout, check field's name`)
	}
	const desc = merge({ name }, pick(FRONT_KEPT_FIELDS, fieldSchema))
	if (desc.type === 'object') {
		return merge(desc, {
			layout: _getLayout(baseName + '.' + name, fieldSchema, fullSchema[name])
		})
	}
	return desc
}
