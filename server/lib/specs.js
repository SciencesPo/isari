'use strict'

const virtuals = require('../../specs/columns.virtual')

module.exports = {
	getMeta,
	getVirtualColumn
}


// Get from meta, case insensitive
function getMeta (name) {
	name = name.toLowerCase()

	return require(`../../specs/schema.${name}.json`)
}

function getVirtualColumn (name) {
	return virtuals[name] || null
}
