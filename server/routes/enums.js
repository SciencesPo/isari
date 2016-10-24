'use strict'

const { Router } = require('express')
const { ClientError } = require('../lib/errors')
const enums = require('../../specs/enums.json')
const { restHandler } = require('../lib/rest-utils')

const countries = require('../../specs/enum.countries.json')
const currencies = require('../../specs/enum.currencies.json')
const languages = require('../../specs/enum.languages.json')


module.exports = Router()
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
