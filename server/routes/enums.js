'use strict'

const { Router } = require('express')
const { ClientError, ServerError } = require('../lib/errors')
const enums = require('../../specs/enums.json')
const specials = require('../../specs/enums.special.js')
const { restHandler } = require('../lib/rest-utils')
const debug = require('debug')('isari:rest:enums')
const model = require('../lib/model')
const { get } = require('lodash/fp')

const countries = require('../../specs/enum.countries.json')
const currencies = require('../../specs/enum.currencies.json')
const languages = require('../../specs/enum.languages.json')


module.exports = Router()
.get('/special/:name', restHandler(getSpecialEnum))
.get('/:name', restHandler(getEnum))


function getEnum (req) {
	if (req.params.name in enums) {
		return formatEnum(req.params.name, enums[req.params.name])
	}

	throw new ClientError({ title: `Unknown enum "${req.params.name}"`, status: 404 })
}


function formatEnum (name, data) {
	// Special cases: some enums are just keys in enums.json and must be matched with another file

	// nationalities
	if (name === 'nationalities') {
		return data.map(value => {
			const { nationalityLabel: label } = countries.find(c => c.alpha2 === value)
			return { value, label }
		})
	}

	// iso4217 === currencies
	if (name === 'currencies' || name === 'iso4217') {
		return data.map(value => {
			const { label, symbol } = currencies.find(c => c.code === value)
			return { value, label, symbol } // TODO use symbol?
		})
	}

	// iso6391 === languages
	if (name === 'languages' || name === 'iso6391') {
		return data.map(value => {
			const { label } = languages.find(c => c['639-1'] === value)
			return { value, label } // TODO use symbol?
		})
	}

	// countries
	if (name === 'countries') {
		return data.map(value => {
			const { countryLabel: label } = countries.find(c => c.alpha2 === value)
			return { value, label }
		})
	}

	// Other cases: no need to reformat
	return data
}


function getSpecialEnum (req) {
	const getEnumValues = specials[req.params.name]

	if (typeof getEnumValues !== 'object') {
		throw new ClientError({ title: `Unknown special enum "${req.params.name}"`, status: 404 })
	}
	if (!getEnumValues.modelName) {
		throw new ServerError({ title: `Invalid special enum "${req.params.name}", modelName not provided in specs/enums.special.js` })
	}
	if (!model[getEnumValues.modelName] || typeof model[getEnumValues.modelName].findById !== 'function') {
		throw new ServerError({ title: `Invalid special enum "${req.params.name}", invalid modelName "${getEnumValues.modelName}" provided in specs/enums.special.js` })
	}
	if (typeof getEnumValues.key !== 'function' && typeof getEnumValues.values !== 'function') {
		throw new ServerError({ title: `Invalid special enum "${req.params.name}", key() or values() not provided in specs/enums.special.js` })
	}
	if (typeof getEnumValues.values !== 'function' && typeof enums[req.params.name] !== 'object') {
		throw new ServerError({ title: `Invalid special enum "${req.params.name}", key() provided but invalid enum values type "${typeof enums[req.params.name]}" in specs/enums.json` })
	}

	// Special enums are expected to be provided a context: object id, and field's full path
	// If any information is missing, we just provide empty suggestions as response
	if (!req.query.id) {
		debug('Missing "id" for special enum', req.url)
		return []
	}
	if (!req.query.path) {
		debug('Missing "path" for special enum', req.url)
		return []
	}

	// Note path is the name of final field, we must go one level upper
	const path = req.query.path.replace(/\.[^\.]*$/, '')
	const id = req.query.id

	// Generate values getter
	if (!getEnumValues.values) {
		getEnumValues.values = (object, field, objectId, fieldPath) => Promise.resolve()
			.then(() => getEnumValues.key(object, field, objectId, fieldPath))
			.then(key => enums[req.params.name][key] || [])
	}

	// Now resolve object, field, and call special enum
	return model[getEnumValues.modelName].findById(id)
		// Grab field from object (everything can be undefined in the end) and call special enum resolver
		.then(object => getEnumValues(object, get(path, object), req.query.id, req.query.path))
		// Convert any falsey value to empty array
		.then(values => values || [])
}
