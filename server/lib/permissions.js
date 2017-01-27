'use strict'

const { map, flow, toPairs, filter, intersection } = require('lodash/fp')
const { ServerError, UnauthorizedError, NotFoundError } = require('./errors')
const { Organization, People, Activity } = require('./model')
const debug = require('debug')('isari:permissions')
const { mongoID } = require('./model-utils')
const { computeConfidentialPaths } = require('./schemas')
const { ObjectId } = require('mongoose').Types.ObjectId

// Constants for optimization
const pTrue = Promise.resolve(true)
const pFalse = Promise.resolve(false)

// Helper returning a YYYY-MM-DD string for today
// TODO cache (it shouldn't change more than once a day, right)
const pad0 = s => (s === null || s === undefined) ? null : (String(s).length === 1 ? '0' + s : String(s))
const isFuture = s => {
	const ref = today()
	const [ y, m, d ] = s.split('-')
	return y > ref.y || (y === ref.y && m > ref.m) || (y === ref.y && m === ref.m && d >= ref.d)
}
const today = () => {
	const d = new Date()
	return {
		y: d.getFullYear(),
		m: pad0(d.getMonth() + 1),
		d: pad0(d.getDate())
	}
}
const parseDate = s => {
	const [ y, m, d ] = s.split('-')
	return {
		y: y,
		m: m ? pad0(m) : null,
		d: d ? pad0(d) : null
	}
}

// Helper returning a Mongo query to compare a date with year*/month*/day* fields
/*
// y > ref.y || (y === ref.y && m > ref.m) || (y === ref.y && m === ref.m && d >= ref.d)
[
	{ endYear: { $gte: ''+now.y } },
	{ endYear: ''+now.y, endMonth: { $gt: ''+now.m } },
	{ endYear: ''+now.y, endMonth: ''+now.m, endDay: { $gte: ''+now.d } }
]
*/
const buildDateQuery = (dateField, op, d) => {
	const yearField = dateField + 'Year'
	const monthField = dateField + 'Month'
	const dayField = dateField + 'Day'
	if (typeof d === 'string') {
		d = parseDate(d)
	}
	const yyyy = String(d.y)
	const mm = d.m ? String(d.m) : null
	const dd = d.d ? String(d.d) : null

	let q = [ { [yearField]: { [op]: yyyy } } ]
	if (mm !== null) {
		q.push({ [yearField]: yyyy, [monthField]: { [op]: mm } })
		if (dd !== null) {
			q.push({ [yearField]: yyyy, [monthField]: mm, [dayField]: { [op]: dd } })
		}
	}

	return q
}


// Extract roles from isariAuthorizedCenters
// People => Object(OrganizationID, Role)
const getRoles = exports.getPeopleOrgRoles = people => {
	const roles = {}
	people.isariAuthorizedCenters.forEach(({ organization, isariRole: role }) => {
		// Some isariAuthorizedCenters can have no "organization" set to define a central role
		if (organization) {
			roles[mongoID(organization)] = role
		}
	})
	return roles
}

// Extract "central_*" roles, keep only highest
// People => null|'admin'|'reader'
const getCentralRole = exports.getPeopleCentralRole = people => people.isariAuthorizedCenters.reduce((result, { isariRole: role }) => {
	if (role === 'central_admin') {
		return 'admin'
	} else if (!result && role === 'central_reader') {
		return 'reader'
	} else {
		return result
	}
}, null)

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
		// TODO maybe they should be declared in scopeOrganizationMiddleware, as it's needed for most of them? Sort it out
		req.userCanEditPeople = p => canEditPeople(req, p)
		req.userCanViewPeople = p => canViewPeople(req, p)
		req.userListViewablePeople = options => listViewablePeople(req, options)
		req.userCanEditActivity = a => canEditActivity(req, a)
		req.userCanViewActivity = a => canViewActivity(req, a)
		req.userListViewableActivities = () => listViewableActivities(req)
		req.userCanEditOrganization = o => canEditOrganization(req, o)
		req.userCanViewConfidentialFields = () => canViewConfidentialFields(req)
		req.userComputeRestrictedFields = modelName => computeRestrictedFieldsShort(modelName, req)

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

	// Whitelisted URLs: /organizations/* and /people/myself
	const isWhitelisted = req.originalUrl.match(/^\/organizations(?:\/|$)/) || req.originalUrl.startsWith('/people/' + req.userId)
	// Global scope requested: check if it is valid for connected user and requested URL
	if (!orgId && !req.userCentralRole && !isWhitelisted) {
		return next(UnauthorizedError({ title: 'Access to global scope refused for non central people, please add "?organization=…" to scope your queries' }))
	}

	// Global scope requested for central user: set scope and let go
	req.userScopeOrganizationId = null
	next()
}

// Restricted access middleware
exports.requiresAuthentication = (req, res, next) => {
	if (req.session.login) {
		next()
	} else {
		next(UnauthorizedError({ title: 'Authentication required for this API' }))
	}
}


// Return viewable people for current user, scope included
/*
Who can *view* a people?
- anyone sharing academicMembership (done by lookup below)
*/
const listViewablePeople = (req, options = {}) => {
	if (!req._scopeOrganizationMiddleware) {
		return Promise.reject(Error('Invalid usage of "listViewablePeople" without prior usage of "scopeOrganizationMiddleware"'))
	}

	let {
		includeExternals = true, includeMembers = true,
		membershipStart = null, membershipEnd = null, includeRange = true
	} = options

	if (includeRange && (includeExternals || includeMembers)) {
		return Promise.reject(Error('Incompatible options "includeRange" with "includeExternals" and "includeMembers"'))
	}
	if (includeRange && (!membershipStart && !membershipEnd)) {
		return Promise.reject(Error('Incomplete usage of "includeRange": missing values for start or end'))
	}
	if (includeRange && !req.userScopeOrganizationId) {
		return Promise.reject(Error('Invalid usage of "includeRange" without organization id provided'))
	}

	// Setting absurd dates to permit no start or end date
	if (includeRange && !membershipStart) {
		membershipStart = '1000-01-01'
	}
	if (includeRange && !membershipEnd) {
		membershipEnd = '9999-01-01'
	}

	// Note: A && B && (C || D) is not supported by Mongo
	// i.e. this must be transformed into (A && B && C) || (A && B && D)

	const now = today()

	// Projected fields, see 'memberships' projection below
	const isInternal = [
		{ orgMonitored: true },
		{ $or: [ { endDate: { $exists: false } } ].concat(buildDateQuery('end', '$gte', now)) }
	]

	const orgId = req.userScopeOrganizationId && ObjectId.createFromHexString(req.userScopeOrganizationId)

	const isMember = orgId
		? // Scoped: limit to people from this organization
			{ 'memberships': { $elemMatch: { $and: isInternal.concat([ { orgId } ]) } } }
		: // Unscoped: at this point he MUST be central, but let's imagine we allow non-central users to have unscoped access, we don't want to mess here
			req.userCentralRole
			? // Central user: access to EVERYTHING
				{}
			: // Limit to people from organizations he has access to
				{ 'memberships.orgId': { $in: Object.keys(req.userRoles).map(ObjectId.createFromHexString) } }

	// External people = ALL memberships are either  expired or linked to an unmonitored organization
	const isExternal = { memberships: {$not: { $elemMatch: { $and: isInternal } } } }

	// Member in date range (like isInternal, without testing isariMonitored)
	const isInRange = (start, end) => {
		// in range = ! (start > membership.endDate || end < membership.startDate)
		//          <=> start <= membership.endDate && end >= membership.startDate
		let inRange = [ { orgId } ]
		if (start) {
			inRange.push({
				$or: buildDateQuery('end', '$gte', start).concat([{ endDate: { $exists: false } }])
			})
		}
		if (end) {
			inRange.push({
				$or: buildDateQuery('start', '$lte', end)
			})
		}
		return { 'memberships': { $elemMatch: { $and: inRange } } }
	}

	const filters = includeRange
		? isInRange(membershipStart, membershipEnd)
		: (includeExternals && includeMembers)
			? { $or: [ isMember, isExternal ] }
			: (includeExternals ? isExternal : isMember)

	// here the mongo query of the death
	return People.aggregate()
		.project({ _id: 1, academicMemberships: 1 }) // Keep original data intact for later use
		.unwind('academicMemberships') // Lookup only works with flat data, unwind array
		.lookup({
			from: Organization.collection.name,
			localField: 'academicMemberships.organization',
			foreignField: '_id',
			as: 'org'
		}) // LEFT JOIN Organization
		.unwind('org') // "orgs" can be a zero-or-one-item array, unwind that before grouping
		.project({ _id: 1, membership: {
			orgId: '$org._id',
			endDate: '$academicMemberships.endDate',
			startDate: '$academicMemberships.startDate',
			orgMonitored: '$org.isariMonitored',
			endYear: { $substr: [ '$academicMemberships.endDate', 0, 4 ] },
			endMonth: { $substr: [ '$academicMemberships.endDate', 5, 2 ] },
			endDay: { $substr: [ '$academicMemberships.endDate', 8, 2 ] },
			startYear: { $substr: [ '$academicMemberships.startDate', 0, 4 ] },
			startMonth: { $substr: [ '$academicMemberships.startDate', 5, 2 ] },
			startDay: { $substr: [ '$academicMemberships.startDate', 8, 2 ] }
		} }) // Group membership info together
		.group({
			_id: '$_id',
			memberships: { $push: '$membership' },
			people: { $first: '$people' }
		}) // Now regroup membership data to single people
		.match(filters) // Finally apply filters
		.project({ _id: 1 }) // Keep only id
		.then(map('_id'))
		.then(ids => {
			let query
			if (includeExternals)
				//add external people which doesn't have any academicMembership
				query = { $or: [ { academicMemberships: { $exists:false } }, { academicMemberships:[] }, { _id: { $in: ids } } ] }
			else
				// Populate to allow getPeoplePermissions to work
				query = { _id: { $in: ids } }

			return {
				query: People.find(query).populate('academicMemberships.organization')
			}
		})
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
const isExternalPeople = p => (
	p.populate('academicMemberships.organization').execPopulate()
	.then(() => (
		// External = no internal membership
		!p.academicMemberships.some(m => (
			// Internal = still active contract with monitored organization
			(!m.endDate || isFuture(m.endDate)) && m.organization.isariMonitored
		))
	))
)

const canEditPeople = (req, p) => {
	// Himself: writable
	if (req.userId === String(p._id)) {
		return pTrue
	}
	// Central reader: readonly
	if (req.userCentralRole === 'reader') {
		return pFalse
	}
	// Central admin: read/write
	if (req.userCentralRole === 'admin') {
		return pTrue
	}
	// Center editor/admin of any common organization
	if (hasMatchingCredentials(req.userRoles, map('organization')(p.academicMemberships), ['center_editor', 'center_admin'])) {
		return pTrue
	}
	return isExternalPeople(p)
}

// See conditions to view a people above
const canViewPeople = (req, p) => { // eslint-disable-line no-unused-vars
	// Note: every people is viewable, this decision is related to the "edit" button on FKs
	return pTrue
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
const canEditActivity = (req, a) => { // eslint-disable-line no-unused-vars
	// Central reader: readonly
	if (req.userCentralRole === 'reader') {
		return pFalse
	}
	if (req.userCentralRole === 'admin') {
		return pTrue
	}
	// Other case: activity is editable if one of its organizations is the current one
	return a.organizations.some(o => mongoID(o.organization) === req.userScopeOrganizationId) ? pTrue : pFalse
}

// I can view an activity iff I have an organization in common (or I'm central)
const canViewActivity = (req, a) => {
	if (req.userCentralRole) {
		return pTrue
	}
	const activityOrganizations = map(o => mongoID(o.organization), a.organizations)
	const userOrganizations = Object.keys(req.userRoles)
	return intersection(activityOrganizations, userOrganizations).length > 0 ? pTrue : pFalse
}

// Check if an organization is editable by current user
const canEditOrganization = (req, o) => { // eslint-disable-line no-unused-vars
	// Central reader: readonly
	if (req.userCentralRole === 'reader') {
		return pFalse
	}
	// Anyone else can edit organization (sounds weird, to be checked later)
	return pTrue
}

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
- GET /model: include additional information
  1. Compute restricted fields patterns
  2. For "others" case, REMOVE restricted fields from output
- PUT/POST /model: check field permissions
*/

const canViewConfidentialFields = (req) => Promise.resolve(
	req.userCentralRole === 'admin' ||
	req.userCentralRole === 'reader' ||
	hasMatchingCredentials(req.userRoles, [ req.userScopeOrganizationId ], [ 'center_admin' ])
)

const computeRestrictedFieldsLong = (modelName, userCentralRole, userRoles, organizationId) => {

	// Central admin → no restriction
	if (userCentralRole === 'admin') {
		return Promise.resolve({
			viewable: true,
			editable: true,
			paths: [] // Do not bother calculate paths
		})
	}

	// Central reader → readonly
	// Center admin → readonly
	if (userCentralRole === 'reader' || hasMatchingCredentials(userRoles, [ organizationId ], [ 'center_admin' ])) {
		return Promise.resolve({
			viewable: true,
			editable: false,
			paths: computeConfidentialPaths(modelName) // paths will be passed to frontend in opts.restrictedFields
		})
	}

	// General case → omit fields
	return Promise.resolve({
		viewable: false,
		editable: false,
		paths: computeConfidentialPaths(modelName) // paths will be used to *remove* fields from object
	})
}

const computeRestrictedFieldsShort = (modelName, req) => computeRestrictedFieldsLong(modelName, req.userCentralRole, req.userRoles, req.userScopeOrganizationId)

exports.computeRestrictedFields = (modelName, userCentralRoleOrReq, userRoles = undefined, organizationId = undefined) => {
	if (userRoles !== undefined && organizationId !== undefined) {
		return computeRestrictedFieldsLong(modelName, userCentralRoleOrReq, userRoles, organizationId)
	} else {
		return computeRestrictedFieldsShort(modelName, userCentralRoleOrReq)
	}
}


// Permissions getters
const getPeoplePermissions = (req, p) => Promise.all([
	req.userCanViewPeople(p),
	req.userCanEditPeople(p),
	req.userComputeRestrictedFields('People')
]).then(([ viewable, editable, confidentials ]) => ({
	viewable,
	editable,
	confidentials
}))
const getActivityPermissions = (req, a) => Promise.all([
	req.userCanViewActivity(a),
	req.userCanEditActivity(a),
	req.userComputeRestrictedFields('Activity')
]).then(([ viewable, editable, confidentials ]) => ({
	viewable,
	editable,
	confidentials
}))
const getOrganizationPermissions = (req, o) => Promise.all([
	pTrue,
	req.userCanEditOrganization(o),
	req.userComputeRestrictedFields('Organization')
]).then(([ viewable, editable, confidentials ]) => ({
	viewable,
	editable,
	confidentials
}))
exports.getPermissions = {
	People: getPeoplePermissions,
	Activity: getActivityPermissions,
	Organization: getOrganizationPermissions
}
