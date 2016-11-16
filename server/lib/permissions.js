'use strict'

const { map, some, flowRight: compose } = require('lodash/fp')
const { mongo } = require('mongoose')
const { ServerError, UnauthorizedError, NotFoundError } = require('./errors')
const { Organization, People } = require('./model')

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
	people.isariAuthorizedCenters.forEach(({ organization, isariRole: role }) => {
		roles[mongoID(organization)] = role
	})
	return roles
}

// People => Boolean
exports.isPeopleCentral = compose(some(role => CENTRAL_ROLES.includes(role)), getRoles)

// Sets "req.userScopeOrganizationId"
// IMPORTANT: requires "rolesMiddleware" to be executed BEFORE
exports.scopeOrganizationMiddleware = (req, res, next) => {
	if (!req._rolesMiddleware) {
		return next(ServerError({ title: 'Invalid usage of "scopeOrganizationMiddleware" without prior usage of "rolesMiddleware"' }))
	}

	req._scopeOrganizationMiddleware = true

	const orgId = req.query.organization // maybe change later, part of URL, different name…

	// Scope requested: check if it is valid for connected user
	if (orgId && !req.userRoles[orgId] && !req.userIsCentral) {
		return next(UnauthorizedError({ title: `Specified invalid scope (organization id) "${orgId}" (user is not central and has no permission on this organization)` }))
	}

	// Scope requested: check if organization exists and then let go
	if (orgId) {
		// Wrap around promises to catch invalid ObjectId format
		return Promise.resolve(orgId)
		.then(id => Organization.findById(id))
		.then(found => {
			if (!found) {
				return Promise.reject(NotFoundError({ title: `Specified invalid scope (organization id) "${orgId}" (not found)` }))
			}
			// Sets scope and let go
			req.userScopeOrganizationId = orgId
			next()
		})
		.catch(next)
	}

	// Global scope requested: check if it is valid for connected user
	if (!orgId && !req.userIsCentral) {
		return next(UnauthorizedError({ title: `Access to global scope refused for non central people, please add "?organization=…" to scope your queries` }))
	}

	// Global scope requested for central user: set scope and let go
	req.userScopeOrganizationId = null
	next()
}


// People, Organization => Boolean
// IMPORTANT: requires "scopeOrganizationMiddleware" to be executed BEFORE
exports.getScopePeopleIds = (req) => {
	if (!req._scopeOrganizationMiddleware) {
		throw new Error('Invalid usage of "getScopePeople" without prior usage of "scopeOrganizationMiddleware"')
	}

	// TODO refactor "today"
	const d = new Date()
	const pad = s => String(s).length === 1 ? '0' + s : String(s)
	const today = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate)}`

	const isInScope = req.userScopeOrganizationId
		? // Scoped: limit to people from this organization
			{ 'memberships.orgId': req.userScopeOrganizationId }
		: // Unscoped: limit to people from organizations he has access to
			{ 'memberships.orgId': { $in: Object.keys(req.userRoles) } }

	// External people = ALL memberships are either expired or linked to an unmonitored organization
	const isExternal = { memberships: { $not: { $elemMatch: {
		$or: [ { endDate: { $gte: today } }, { endDate: { $exists: false } } ],
		orgMonitored: true
	} } } }

	// Use aggregation to lookup organization and calculate union of "in scope" + "externals"
	/* First version kept for history: much more performant, but we must return a Mongoose.Query to allow proper population,
		formatting, templating… in rest-utils. A wide rewrite should be planned to allow using aggregations in REST endpoints

	return People.aggregate()
		.project({ _id: 1, people: '$$ROOT' }) // Keep original data intact for later use
		.unwind('people.academicMemberships') // Lookup only works with flat data, unwind array
		.lookup({ from: Organization.collection.name, localField: 'people.academicMemberships.organization', foreignField: '_id', as: 'orgs' }) // LEFT JOIN Organization
		.unwind('orgs') // "orgs" can be a zero-or-one-item array, unwind that before grouping
		.project({ _id: 1, people: 1, membership: { orgId: '$orgs._id', endDate: '$people.academicMemberships.endDate', orgMonitored: '$orgs.isariMonitored' } }) // Group membership info together
		.group({ _id: '$_id', memberships: { $push: '$membership' }, people: { $first: '$people' } }) // Now regroup membership data to single people
		.match({ $or: [ isInScope, isExternal ] }) // Finally apply filters
		.then(map(p => Object.assign(p.people, { // And keep only People (untouched) data with additional membership info
			_external: !p.memberships.some(m => m.endDate && m.endDate >= today && m.orgMonitored)
		})))
	*/
	return People.aggregate()
		.project({ _id: 1, academicMemberships: 1 }) // Keep original data intact for later use
		.unwind('academicMemberships') // Lookup only works with flat data, unwind array
		.lookup({ from: Organization.collection.name, localField: 'academicMemberships.organization', foreignField: '_id', as: 'org' }) // LEFT JOIN Organization
		.unwind('org') // "orgs" can be a zero-or-one-item array, unwind that before grouping
		.project({ _id: 1, membership: { orgId: '$org._id', endDate: '$academicMemberships.endDate', orgMonitored: '$org.isariMonitored' } }) // Group membership info together
		.group({ _id: '$_id', memberships: { $push: '$membership' }, people: { $first: '$people' } }) // Now regroup membership data to single people
		.match({ $or: [ isInScope, isExternal ] }) // Finally apply filters
		.project({ _id: 1 }) // Keep only id
		.then(map('_id'))
}

exports.getScopeActivities = (req) => {

}
