'use strict'

const virtuals = require('../../specs/columns.virtual')
const frontendConfig = require('../../specs/frontendConfig.json')

module.exports = {
	getMeta,
	getVirtualColumn,
	frontendConfig
}


// Get from meta, case insensitive
function getMeta (name) {
	name = name.toLowerCase()

	return require(`../../specs/schema.${name}.json`)
}

function getVirtualColumn (name) {
	return virtuals[name] || null
}
