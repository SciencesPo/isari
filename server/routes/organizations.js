'use strict'

const { restRouter } = require('../lib/rest-utils')
const { Organization } = require('../lib/model')
const { clone } = require('lodash/fp')


module.exports = restRouter(Organization, formatOrganization, 'organization')


function formatOrganization (organization) {
	let o = organization.toObject ? organization.toObject() : clone(organization)

	o.id = o._id

	delete o._id
	delete o.__v

	return o
}
