'use strict'

const { getFrontSchema, RESERVED_FIELDS, FRONT_KEPT_FIELDS } = require('./schemas')
const { readdirSync } = require('fs')
const path = require('path')
const { pick, merge, map, difference, isArray, isObject, isString, flatten } = require('lodash/fp')
const util = require('util')
const memoize = require('memoizee')


module.exports = {
	getLayout: memoize(name => _getLayout(name, getFrontSchema(name)))
}


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
			return Object.assign(o, { [key]: data })
		}, {})
}

const _getLayout = (name, schema) => {
	if (!schema) {
		return null
	}
	const rows = (layouts[name] || []).map(getRow(name, schema))
	const rowsFields = flatten(rows.map(row => map('name', row.fields)))
	const expectedFields = Object.keys(schema).filter(f => !RESERVED_FIELDS.includes(f) && f[0] !== '/')
	const missingFields = difference(expectedFields, rowsFields)
	return rows.concat(missingFields.map(getRow(name, schema)))
		// Ignored fields
		.map(row => Object.assign(row, {
			fields: row.fields.filter(field => !field.ignored) // Remove ignored fields
		}))
		.filter(row => row.fields.length > 0) // Remove empty rows
}

const getRow = (name, schema) => row => {
	if (isArray(row)) {
		return getRowArray(name, schema, row)
	} else if (isObject(row)) {
		return getRowObject(name, schema, row)
	} else if (isString(row)) {
		return getRowString(name, schema, row)
	} else {
		throw Error(`${name}: invalid type for layout row description (expects array, object or string, got ${util.inspect(row)}`)
	}
}

const getRowString = (baseName, schema, row) => getRowArray(baseName, schema, [row])

const getRowArray = (baseName, schema, fields) => getRowObject(baseName, schema, {
	// no label
	// not collapsable
	fields
})

const getRowObject = (baseName, schema, row) => merge(
	pick([ 'label', 'collapsabled' ].concat(FRONT_KEPT_FIELDS), row),
	{
		fields: row.fields.map(getFieldsDescription(baseName, schema))
	}
)

const getFieldsDescription = (baseName, schema) => name => {
	if (name[0] === '-') {
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
			layout: _getLayout(baseName + '.' + name, fieldSchema)
		})
	}
	return desc
}
