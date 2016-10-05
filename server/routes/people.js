'use strict'

const { restRouter } = require('../lib/rest-utils')
const People = require('../lib/model')


module.exports = restRouter(People, formatPeople, 'people')


function formatPeople (people) {
	let o = people.toObject()

	o.id = o._id

	delete o._id
	delete o.__v

	return o
}
