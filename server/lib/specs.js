'use strict'

const metas = require('../../specs/schema.meta.json')


module.exports = {
	getMeta
}


// Get from meta, case insensitive
function getMeta (name) {
	name = name.toLowerCase()

	for (let key in metas) {
		if (key.toLowerCase() === name) {
			return metas[key]
		}
	}

	return null
}
