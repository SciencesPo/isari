'use strict'

const { map, reduce, flow, toPairs, filter, intersection } = require('lodash/fp')
const { mongo } = require('mongoose')
const { ServerError, UnauthorizedError, NotFoundError } = require('./errors')
const { Organization, People, Activity } = require('./model')
const debug = require('debug')('isari:permissions')


// Helper to safely get a string from Mongoose instance, ObjectId, or direct string (populate-proof)
// Object|ObjectID|String => String
const mongoID = o => (o instanceof mongo.ObjectID) ? o.toHexString() : (o ? (o.id ? o.id : (o._id ? o._id.toHexString() : o)) : null)

// Helper returning a YYYY-MM-DD string for today
// TODO cache (it shouldn't change more than once a day, right)
const today = () => {
	const d = new Date()
	const pad = s => String(s).length === 1 ? '0' + s : String(s)
	return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate)}`
}

// Extract roles from isariAuthorizedCenters
// People => Object(OrganizationID, Role)
const getRoles = (people) => {
	const roles = {}
	people.isariAuthorizedCenters.forEach(({ organization, isariRole: role }) => {
		roles[mongoID(organization)] = role
	})
	return roles
}

// Extract "central_*" roles, keep only highest
// People => null|'admin'|'reader'
const getCentralRole = exports.getPeopleCentralRole = flow(getRoles, reduce((result, role) => {
	if (role === 'central_admin') {
		return 'admin'
	} else if (!result && role === 'central_reader') {
		return 'reader'
	} else {
		return result
	}
}, null))

// Returns matched expectedCredentials by user roles for given organization ids
// Object({ OrganizationId: Role }), Array(OrganizationId), Array(Role) => Array(Role)
const getMatchingCredentials = (userRoles, organizationIds, expectedRoles) => {
	organizationIds = map(mongoID)(organizationIds)
	return flow(
		toPairs, // Array([OrganizationId, Role])
		filter(([id]) => organizationIds.includes(id)), // Scope
		map(1), // Array(Role)
		intersection(expectedRoles) // Array(Role), only the ones matching
	)(userRoles)
}
const hasMatchingCredentials = (u, o, e) => getMatchingCredentials(u, o, e).length > 0

// Credentials middleware
// sets a bunch of user* properties easing permissions checking
exports.rolesMiddleware = (req, res, next) => {
	req._rolesMiddleware = true

	if (!req.session.login) {
		debug('not logged in')
		return next()
	}

	People.findOne({ ldapUid: req.session.login }).then(people => {
		if (!people) {
			debug('invalid login: force-disconnect!')
			req.session.login = null
			return next()
		}

		req.userId = people.id
		req.userPeople = people
		req.userRoles = getRoles(people)
		req.userCentralRole = getCentralRole(people)

		debug('logged in: add credentials helpers', req.userRoles)

		// Credential helpers
		req.userCanEditPeople = p => canEditPeople(req, p)
		req.userCanViewPeople = p => canViewPeople(req, p)
		req.userListViewablePeople = () => listViewablePeople(req)
		req.userCanEditActivity = a => canEditActivity(req, a)
		req.userCanViewActivity = a => canViewActivity(req, a)
		req.userListViewableActivities = () => listViewableActivities(req)
		req.userCanEditOrganization = o => canEditOrganization(req, o)
		req.userCanViewConfidentialFields = () => canViewConfidentialFields(req)

		debug(req.userRoles)
		next()
	})
}

// scope middleware
// Sets "req.userScopeOrganizationId" and check its validity
exports.scopeOrganizationMiddleware = (req, res, next) => {
	if (!req._rolesMiddleware) {
		return next(ServerError({ title: 'Invalid usage of "scopeOrganizationMiddleware" without prior usage of "rolesMiddleware"' }))
	}

	req._scopeOrganizationMiddleware = true

	const orgId = req.query.organization // maybe change later, part of URL, different name…

	// Scope requested: check if it is valid for connected user
	if (orgId && !req.userRoles[orgId] && !req.userCentralRole) {
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
	if (!orgId && !req.userCentralRole) {
		return next(UnauthorizedError({ title: 'Access to global scope refused for non central people, please add "?organization=…" to scope your queries' }))
	}

	// Global scope requested for central user: set scope and let go
	req.userScopeOrganizationId = null
	next()
}

// Return viewable people for current user, scope included
/*
Who can *view* a people?
- anyone sharing academicMembership (done by lookup below)
*/
const listViewablePeople = (req) => {
	if (!req._scopeOrganizationMiddleware) {
		return Promise.reject(Error('Invalid usage of "listViewablePeople" without prior usage of "scopeOrganizationMiddleware"'))
	}

	const isInScope = req.userScopeOrganizationId
		? // Scoped: limit to people from this organization
			{ 'memberships.orgId': req.userScopeOrganizationId }
		: // Unscoped: at this point he MUST be central, but let's imagine we allow non-central users to have unscoped access, we don't want to mess here
			req.userCentralRole
			? // Central user: access to EVERYTHING
				{}
			: // Limit to people from organizations he has access to
				{ 'memberships.orgId': { $in: Object.keys(req.userRoles) } }

	// External people = ALL memberships are either expired or linked to an unmonitored organization
	const isExternal = { memberships: { $not: { $elemMatch: {
		$or: [ { endDate: { $gte: today() } }, { endDate: { $exists: false } } ],
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
			_external: !p.memberships.some(m => m.endDate && m.endDate >= today() && m.orgMonitored)
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
		.then(ids => ids.concat([ req.userId ])) // Ensure I always see myself
		.then(ids => ({
			// Populate to allow getPeoplePermissions to work
			query: People.find({ _id: { $in: ids } }).populate('academicMemberships.organization')
		}))
}

// Check if a people is editable by current user
/*
Who can *write* a people?
- himself
- central admin
- anyone if people is external
- center admin of people's centers (academicMemberships)
- center editor of people's centers (academicMemberships)
*/
const isExternalPeople = p => p.populate('academicMemberships.organization').execPopulate().then(() => {
	return !p.academicMemberships.some(m => m.endDate && m.endDate >= today() && m.organization.isariMonitored)
})
const canEditPeople = (req, p) => {
	// Direct tests: himself or central admin
	if (req.userId === String(p._id) || req.userCentralRole === 'admin') {
		return Promise.resolve(true)
	}
	// Center editor/admin of any common organization
	if (hasMatchingCredentials(req.userRoles, map('organization')(p.academicMemberships), ['center_editor', 'center_admin'])) {
		return Promise.resolve(true)
	}
	return isExternalPeople(p)
}

// See conditions to view a people above
const canViewPeople = (req, p) => {
	if (req.userCentralRole) {
		return true
	}
	if (isExternalPeople(p)) {
		return true
	}
	/*
	if ()
	const isInScope = req.userScopeOrganizationId
		? // Scoped: limit to people from this organization
			{ 'memberships.orgId': req.userScopeOrganizationId }
		: // Unscoped: at this point he MUST be central, but let's imagine we allow non-central users to have unscoped access, we don't want to mess here
			req.userCentralRole
			? // Central user: access to EVERYTHING
				{}
			: // Limit to people from organizations he has access to
				{ 'memberships.orgId': { $in: Object.keys(req.userRoles) } }

	// External people = ALL memberships are either expired or linked to an unmonitored organization
	const isExternal = { memberships: { $not: { $elemMatch: {
		$or: [ { endDate: { $gte: today() } }, { endDate: { $exists: false } } ],
		orgMonitored: true
	} } } }

	const activityOrganizations = map(o => mongoID(o.organization), a.organizations)
	const userOrganizations = Object.keys(req.userRoles)
	return intersection(activityOrganizations, userOrganizations).length > 0
	*/
}

// Return viewable activities for current user, scope included
/*
Who can *view* an activity?
- anyone having access to any of its organizations
(access has been checked by scope earlier, so it's just about checking if activity.organizations contains requested scope)
*/
const listViewableActivities = (req) => {
	if (!req._scopeOrganizationMiddleware) {
		return Promise.reject(Error('Invalid usage of "listViewableActivities" without prior usage of "scopeOrganizationMiddleware"'))
	}

	const filter = req.userScopeOrganizationId
		? // Scoped: limit to people from this organization
			{ 'organizations.organization': req.userScopeOrganizationId }
		: // Unscoped: at this point he MUST be central, but let's imagine we allow non-central users to have unscoped access, we don't want to mess here
			req.userCentralRole
			? // Central user: access to EVERYTHING
				{}
			: // Limit to activities of organizations he has access to
				{ 'organizations.organization': { $in: Object.keys(req.userRoles) } }

	return Promise.resolve({ query: Activity.find(filter) })
}

// Check if an activity is editable by current user
/*
Who can *edit* an activity?
- central admin
*/
const canEditActivity = (req, a) => // eslint-disable-line no-unused-vars
	Promise.resolve(req.userCentralRole === 'admin') // central admin or central reader

// I can view an activity iff I have an organization in common (or I'm central)
const canViewActivity = (req, a) => {
	if (req.userCentralRole) {
		return true
	}
	const activityOrganizations = map(o => mongoID(o.organization), a.organizations)
	const userOrganizations = Object.keys(req.userRoles)
	return intersection(activityOrganizations, userOrganizations).length > 0
}

// Check if an organization is editable by current user
/*
Who can *edit* an organization?
- central admin
- center admin for this organization
*/
const canEditOrganization = (req, o) => // eslint-disable-line no-unused-vars
	Promise.resolve(
		req.userCentralRole === 'admin' || // central admin or central reader
		hasMatchingCredentials(req.userRoles, [o], ['center_admin'])
	)

/* Now about restricted fields:

- central_admin (1) has no restriction
- central_reader (2) and center_admin (3) can VIEW restricted fields
- others don't get to see them

(1) req.userCentralRole === 'admin'
(2) req.userCentralRole === 'reader'
(3) hasMatchingCredentials(req.userRoles, [scopeOrganization], ['center_admin'])

All this can get calculated from 'req' only, so that /schemas and /layouts can work

- /schemas: remove confidential fields for "others"
- /layouts: idem
- /model: include
From that we have two missions:

1. Compute restricted fields patterns
2. For last case, REMOVE restricted fields from output
*/

const canViewConfidentialFields = (req) => Promise.resolve(
	req.userCentralRole === 'admin' ||
	req.userCentralRole === 'reader' ||
	hasMatchingCredentials(req.userRoles, [ req.userScopeOrganizationId ], [ 'center_admin' ])
)
