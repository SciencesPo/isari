'use strict'

const { expect } = require('chai')
const { connect, People, Organization, Activity } = require('../lib/model')
const { agent } = require('./http-utils')

describe('Central roles', () => {
	const req = {
		centralReader: agent(),
		centralAdmin: agent(),
		centerMember: agent()
	}

	let fixtures = null
	let connection = null
	before(() => connect().then(conn => connection = conn).then(cleanup).then(prepare).then(fixt => fixtures = fixt))
	after(() => cleanup().then(() => connection && connection.close()))

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
				const query = req[k]
				return query('post', '/auth/login', data)
			})
			.map(q => q.then(({ status }) => expect(status).to.equal(200)))
		)
	)

	it('central reader should see main activity')
	it('central reader should see other activity')
	it('central admin should see main activity')
	it('central admin should see other activity')
	it('center member should see main activity')
	it('center member should not see other activity')

	it('central reader should not edit main activity')
	it('central reader should not edit other activity')
	it('central admin should edit main activity')
	it('central admin should edit other activity')
	it('center member should not edit main activity')
	it('center member should not edit other activity')
})

// Fixtures:
// Organizations: 2 fake
// People: 1 central_reader, 1 central_admin, 1 center_member
// Activities: 1 fake
function prepare () {
	const organization = new Organization({
		name: 'Test Organization (main)',
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
		academicMemberships: [{ organization }],
		latestChangeBy: 'UnitTests'
	})

	const centralAdmin = new People({
		name: 'Central Admin',
		ldapUid: 'central-admin',
		isariAuthorizedCenters: [{
			organization,
			isariRole: 'central_admin'
		}],
		academicMemberships: [{ organization }],
		latestChangeBy: 'UnitTests'
	})

	const centerMember = new People({
		name: 'Research Member',
		ldapUid: 'center-member',
		isariAuthorizedCenters: [{
			organization,
			isariRole: 'center_member'
		}],
		academicMemberships: [{ organization }],
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
	]).then(([[organization, centralReader, centralAdmin, centerMember, activity], [organization2, activity2]]) => ({
		organization,
		centralReader,
		centralAdmin,
		centerMember,
		activity,
		organization2,
		activity2
	}))
}

function cleanup () {
	return Promise.all([
		People.remove(),
		Organization.remove(),
		Activity.remove()
	])
}
