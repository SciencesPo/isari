'use strict'

const { some, flowRight: compose } = require('lodash/fp')
const { mongo } = require('mongoose')

// Object|ObjectID|String => String
const mongoID = o => (o instanceof mongo.ObjectID) ? o.toHexString() : (o ? (o.id ? o.id : (o._id ? o._id.toHexString() : o)) : null)

// Roles defining a "central" user, who can access unscoped APIs
const CENTRAL_ROLES = [
	'central_admin',
	'central_reader'
]

// People => Object(OrganizationID, Role)
const getRoles = exports.getPeopleRoles = (people) => {
	const roles = {}
	people.isariAuthorizedCenters.forEach(({ organization: orgId, isariRole: role }) => {
		roles[mongoID(orgId)] = role
	})
	return roles
}

// People => Boolean
exports.isPeopleCentral = compose(some(role => CENTRAL_ROLES.includes(role)), getRoles)
