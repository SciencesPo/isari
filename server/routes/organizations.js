'use strict'

const { restRouter } = require('../lib/rest-utils')
const Organization = require('../lib/model')


module.exports = restRouter(Organization, formatOrganization, 'organization')


function formatOrganization (organization) {
	let o = organization.toObject()

	o.id = o._id

	delete o._id
	delete o.__v

	return o
}
