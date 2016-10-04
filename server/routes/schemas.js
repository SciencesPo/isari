'use strict'

const { Router } = require('express')
const { ClientError } = require('../lib/errors')
const metas = require('../../specs/schema.meta.json')
const { restHandler } = require('../lib/rest-utils')
const { RESERVED_FIELDS } = require('../lib/schemas')

module.exports = Router()
.get('/:name', restHandler(getSchema))


function getSchema (req) {
	const name = req.params.name.toLowerCase()

	for (let key in metas) {
		if (key.toLowerCase() === name) {
			return formatMeta(metas[key], {
				admin: false // TODO from web session
			})
		}
	}

	throw new ClientError({ title: `Unknown model "${req.params.name}"`, status: 404 })
}

const KEPT_FIELDS = [
	'label',
	'requirement',
	'suggestions',
	'type',
	'ref',
	'enum',
	'default',
	'min',
	'max',
	'regex'
]

function formatMeta (meta, options = {}) {
	const { admin = false } = options

	const multiple = Array.isArray(meta)
	const desc = multiple ? meta[0] : meta

	const handleField = (result, name) => {
		if (!result) {
			return result // Skipped field
		}

		if (!RESERVED_FIELDS.includes(name)) {
			// Sub-field: just include it
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
		else if (KEPT_FIELDS.includes(name)) {
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

	// Handle multi-valued fields
	if (multiple) {
		result.multiple = true
	}

	return result
}
