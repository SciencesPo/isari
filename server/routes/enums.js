'use strict'

const { Router } = require('express')
const { ClientError } = require('../lib/errors')
const enums = require('../../specs/schema.enums.json')
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
	// Special cases: some enums are just keys in schema.enums.json and must be matched with another file
	if (name === 'nationalities') {
		return data.map(value => {
			const { nationalityLabel: label } = countries.find(c => c.alpha2 === value)
			return { value, label }
		})
	}

	// Other cases: no need to reformat
	return data
}
