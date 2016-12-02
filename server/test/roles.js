'use strict'

const { expect } = require('chai')
const { connect, People, Organization, Activity } = require('../lib/model')
const { agent } = require('./http-utils')
const { omit } = require('lodash/fp')
const config = require('config')

// beware, in less than a thousand years tests will break
const future = '2999-12-31'

describe('Central roles', () => {
	let fixtures = null
	let connection = null
	before(() => connect().then(conn => connection = conn).then(cleanup).then(prepare).then(fixt => fixtures = fixt))
	after(() => cleanup().then(() => connection && connection.close()))

	// Log all profiles
	const req = {}
	before(() =>
		Promise.all(
			[
				'centralReader',
				'centralAdmin',
				'centerMember'
			]
			.map(k => {
				const data = {
					login: fixtures[k].ldapUid,
					password: 'whatever'
				}
				const query = req[k] = agent()
				return query('post', '/auth/login', data)
			})
			.map(q => q.then(({ status }) => expect(status).to.equal(200)))
		)
	)

	// Prepare utils
	let utils = null
	before(() => utils = testUtils(req, fixtures))

	it('central reader should see readonly main activity (without org filter)', () => utils.activity.editable('centralReader', false, fixtures.activity, false))
	it('central reader should see readonly activity (without org filter)', () => utils.activity.editable('centralReader', false, fixtures.activity2, false))
	it('central admin should see editable activity (without org filter)', () => utils.activity.editable('centralAdmin', true, fixtures.activity, false))
	it('central admin should see editable other activity (without org filter)', () => utils.activity.editable('centralAdmin', true, fixtures.activity2, false))
	it('center member should not see main activity (without org filter)', () => utils.activity.accessible('centerMember', 401, fixtures.activity, false))
	it('center member should see editable main activity (with org filter)', () => utils.activity.editable('centerMember', true, fixtures.activity, true))
	it('center member should not see other activity (with org filter)', () => utils.activity.accessible('centerMember', 403, fixtures.activity2, true))

	it('central admin should see editable people (without org filter)', () => utils.people.editable('centralAdmin', true, fixtures.centerMember, false))
	it('central reader should see readonly people (without org filter)', () => utils.people.editable('centralReader', false, fixtures.centerMember, false))
	it('center member should see editable himself (himself, with org filter)', () => utils.people.editable('centerMember', true, fixtures.centerMember, true))
	it('center member should see readonly other people (with org filter)', () => utils.people.editable('centerMember', false, fixtures.centralReader, true))
	it('center member should see editable external people (with org filter)', () => utils.people.editable('centerMember', true, fixtures.externalPeople, true))

	it('central admin should see editable organization (without org filter)', () => utils.organization.editable('centralAdmin', true, fixtures.organization, false))
	it('central reader should see readonly organization (without org filter)', () => utils.organization.editable('centralReader', false, fixtures.organization, false))
	it('center member should see editable organization (with org filter)', () => utils.organization.editable('centerMember', true, fixtures.organization, true))

	// Unfiltered accesses to organizations and personal people should be possible
	it('center member should see editable organization (without org filter)', () => utils.organization.editable('centerMember', true, fixtures.organization, false))
	it('center member should see editable himself (without org filter)', () => utils.people.editable('centerMember', true, fixtures.centerMember, false))

	it('central admin should see monitored organizations + "Sciences Po" in his home menu', () =>
		req.centralAdmin('get', '/auth/permissions').then(({ status, body }) => {
			expect(status).to.equal(200)
			expect(body).to.be.an('object')
			expect(body.central).to.equal('admin')
			expect(body.organizations).to.be.an('array').and.have.length(2)
			expect(omit('restrictedFields', body.organizations[0])).to.eql(config.globalOrganization)
			expect(body.organizations[1].id).to.eql(fixtures.organization.id)
		})
	)
	it('central reader should see monitored organizations + "Sciences Po" in his home menu', () =>
		req.centralReader('get', '/auth/permissions').then(({ status, body }) => {
			expect(status).to.equal(200)
			expect(body).to.be.an('object')
			expect(body.central).to.equal('reader')
			expect(body.organizations).to.be.an('array').and.have.length(2)
			expect(omit('restrictedFields', body.organizations[0])).to.eql(config.globalOrganization)
			expect(body.organizations[1].id).to.eql(fixtures.organization.id)
		})
	)
	it('center member should only see his organizations in his home menu', () =>
		req.centerMember('get', '/auth/permissions').then(({ status, body }) => {
			expect(status).to.equal(200)
			expect(body).to.be.an('object')
			expect(body.central).to.equal(null)
			expect(body.organizations).to.be.an('array').and.have.length(1)
			expect(body.organizations[0].id).to.equal(fixtures.organization.id)
		})
	)
})

// Fixtures:
// Organizations: 2 fake
// People: 1 central_reader, 1 central_admin, 1 center_member
// Activities: 1 fake
function prepare () {
	const organization = new Organization({
		name: 'Test Organization (main)',
		isariMonitored: true,
		latestChangeBy: 'UnitTests'
	})

	const organization2 = new Organization({
		name: 'Other organization',
		latestChangeBy: 'UnitTests'
	})

	const centralReader = new People({
		name: 'Central Reader',
		ldapUid: 'central-reader',
		isariAuthorizedCenters: [{
			organization,
			isariRole: 'central_reader'
		}],
		academicMemberships: [{ organization, endDate: future }],
		latestChangeBy: 'UnitTests'
	})

	const centralAdmin = new People({
		name: 'Central Admin',
		ldapUid: 'central-admin',
		isariAuthorizedCenters: [{
			organization,
			isariRole: 'central_admin'
		}],
		academicMemberships: [{ organization, endDate: future }],
		latestChangeBy: 'UnitTests'
	})

	const centerMember = new People({
		name: 'Research Member',
		ldapUid: 'center-member',
		isariAuthorizedCenters: [{
			organization,
			isariRole: 'center_member'
		}],
		academicMemberships: [{ organization, endDate: future }],
		latestChangeBy: 'UnitTests'
	})

	const externalPeople = new People({
		name: 'External People',
		ldapUid: 'external-people',
		isariAuthorizedCenters: [],
		academicMemberships: [],
		latestChangeBy: 'UnitTests'
	})

	const activity = new Activity({
		name: 'Activity (main)',
		activityType: 'projetderecherche',
		organizations: [ { organization } ],
		latestChangeBy: 'UnitTests'
	})

	const activity2 = new Activity({
		name: 'Other activity',
		activityType: 'projetderecherche',
		organizations: [ { organization2 } ],
		latestChangeBy: 'UnitTests'
	})

	return Promise.all([
		externalPeople.save(),
		// Main organization
		organization.save().then(org => Promise.all([
			org,
			centralReader.save(),
			centralAdmin.save(),
			centerMember.save(),
			activity.save()
		])),
		// Other organization: not linked with any people so central should see it but not others
		organization2.save().then(org => Promise.all([
			org,
			activity2.save()
		]))
	])
	.then(([externalPeople, [organization, centralReader, centralAdmin, centerMember, activity], [organization2, activity2]]) => ({
		organization,
		externalPeople,
		centralReader,
		centralAdmin,
		centerMember,
		activity,
		organization2,
		activity2
	}))
	.catch(e => {
		console.error('FIXTURES LOADING FAILED', e.errors)
		throw e
	})
}

function cleanup () {
	return Promise.all([
		People.remove(),
		Organization.remove(),
		Activity.remove()
	])
}

const testUtils = (req, fixtures) => {
	const testRequest = ({ role, url, org, expected = {} }) =>
		req[role]('get', url + '?organization=' + (org || ''))
		.then(({ body, status }) => {
			expect(status).to.equal(expected.status || 200)
			expect(body).to.be.an('object')
			expect(body).to.have.property('id')
			if (expected.editable !== undefined) {
				expect(body).to.have.property('opts').to.be.an('object').and.have.property('editable').to.equal(expected.editable)
			}
		})
		.catch(err => {
			if (err.name === 'AssertionError' || !err.statusCode || !expected.status) {
				throw err
			}
			expect(err.statusCode).to.equal(expected.status || 200)
		})

	const testEditable = (role, expectedEditable, url, orgFilter) => testRequest({ role, url, org: orgFilter ? fixtures.organization.id : false, expected: { editable: expectedEditable } })
	const testAccessible = (role, expectedStatus, url, orgFilter) => testRequest({ role, url, org: orgFilter ? fixtures.organization.id : false, expected: { status: expectedStatus } })

	return {
		activity: {
			editable: (role, expectedEditable, activity, orgFilter) => testEditable(role, expectedEditable, '/activities/' + activity.id, orgFilter),
			accessible: (role, expectedStatus, activity, orgFilter) => testAccessible(role, expectedStatus, '/activities/' + activity.id, orgFilter)
		},
		organization: {
			editable: (role, expectedEditable, organization, orgFilter) => testEditable(role, expectedEditable, '/organizations/' + organization.id, orgFilter),
			accessible: (role, expectedStatus, organization, orgFilter) => testAccessible(role, expectedStatus, '/organizations/' + organization.id, orgFilter)
		},
		people: {
			editable: (role, expectedEditable, people, orgFilter) => testEditable(role, expectedEditable, '/people/' + people.id, orgFilter),
			accessible: (role, expectedStatus, people, orgFilter) => testAccessible(role, expectedStatus, '/people/' + people.id, orgFilter)
		},
	}
}
