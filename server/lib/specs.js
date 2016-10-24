'use strict'

module.exports = {
	getMeta
}


// Get from meta, case insensitive
function getMeta (name) {
	name = name.toLowerCase()

	return require(`../../specs/schema.${name}.json`)
}
