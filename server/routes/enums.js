'use strict'

const { Router } = require('express')
const { ClientError } = require('../lib/errors')
const enums = require('../../specs/schema.enums.json')
const { restHandler } = require('../lib/rest-utils')

const countries = require('../../specs/enum.countries.json')
const currencies = require('../../specs/enum.currencies.json')
const languages = require('../../specs/enum.languages.json')

const info = { countries, currencies, languages }


module.exports = Router()
.get('/:name', restHandler(getEnum))
.get('/info/:name', restHandler(getInfo))


function getEnum (req) {
	if (req.params.name in enums) {
		return formatEnum(req.params.name, enums[req.params.name])
	}

	throw new ClientError({ title: `Unknown enum "${req.params.name}"`, status: 404 })
}

function getInfo (req) {
	if (req.params.name in info) {
		return formatInfo(req.params.name, info[req.params.name])
	}

	throw new ClientError({ title: `No details info for enum "${req.params.name}"`, status: 404 })
}


function formatEnum (name, data) {
	// TODO format for frontend needs
	return Promise.resolve(data)
}

function formatInfo (name, data) {
	// TODO format for frontend needs
	return Promise.resolve(data)
}
