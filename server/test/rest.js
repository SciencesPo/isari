'use strict'

const { expect } = require('chai')
const { connect, People, Organization, Activity } = require('../lib/model')
const { merge, omit, map } = require('lodash/fp')
const { agent } = require('./http-utils')


describe('REST', () => {

	let connection

	before(() => connect().then(conn => connection = conn))
	after(() => connection && connection.close())

	describeModelRestApi('/people', People, ({ organization }) => ({
		name: 'John Doe',
		academicMemberships: [ { organization } ] // Without this, user cannot be seen from the creator
	}), () => ({
		name: 'John Doe (modified)'
	}), '&include=externals') // Created people is an external as organization is not monitored

	describeModelRestApi('/organizations', Organization, () => ({
		name: 'Missing & co'
	}), () => ({
		name: 'Missing & co (modified)'
	}))

	describeModelRestApi('/activities', Activity, ({ organization }) => ({
		name: 'Find someone',
		activityType: 'projetderecherche',
		organizations: [ { organization } ] // Without this, activity cannot be seen from the creator
	}), () => ({
		name: 'Find someone (modified)'
	}))

})


function describeModelRestApi (root, Model, create, update, listSuffix = '') {
	const query = agent()

	describe(`${root} (basics)`, () => {

		let initialCount = (Model === People || Model === Organization) ? 1 : 0 // increment initial count if People or Organization, as we add some credentials
		let doc = null
		let adminLogin = 'test.test'
		let admin = null
		let organization = null

		before(() => Model.remove())

		// Add an organization for permissions
		before(() =>
			(new Organization({
				name: 'Test Organization',
				latestChangeBy: 'UnitTests'
			})).save().then(o => organization = o)
		)
		// Cleanup organization
		after(() => Organization.findById(organization.id).then(o => o ? o.remove() : Promise.reject('Organization not found for cleanup')))

		// Add a user for authentication
		before(() =>
			(new People({
				name: 'Test User',
				ldapUid: adminLogin,
				latestChangeBy: 'UnitTests',
				// Make this user central admin
				isariAuthorizedCenters: [{
					organization,
					isariRole: 'central_admin'
				}],
				academicMemberships: [{ organization }]
			})).save().then(o => admin = o)
		)
		// Log out at the end, but do it BEFORE deleting user
		after(() => query('post', '/auth/logout').then(({ body, status }) => {
			expect(status).to.equal(200)
			expect(body).to.eql({ was: adminLogin })
		}))
		// Cleanup user
		after(() => People.findOne({ ldapUid: adminLogin }).then(o => o ? o.remove() : Promise.reject('Admin not found for cleanup')))

		// Authenticate first
		it('should authenticate', () =>
			query('post', '/auth/login', { login: adminLogin, password: 'whatever' }).then(({ body, status }) => {
				expect(status).to.equal(200)
				expect(body).to.be.an('object').and.have.property('login').to.equal(adminLogin)
				expect(body).to.have.property('people').to.be.an('object').to.have.property('ldapUid').to.equal(adminLogin)
			})
		)

		it('should be authenticated', () =>
			query('get', '/auth/myself').then(({ body, status }) => {
				expect(status).to.equal(200)
				expect(body).to.be.an('object').and.have.property('login').to.equal(adminLogin)
				expect(body).to.have.property('people').to.be.an('object').to.have.property('ldapUid').to.equal(adminLogin)
			})
		)

		it('GET / (empty)', () =>
			query('get', root + '?organization=' + organization.id + listSuffix).then(({ body, status }) => {
				expect(status).to.equal(200)
				expect(body).to.be.an('array').and.have.length(0 + initialCount)
			})
		)

		it('POST / (create)', () =>
			query('post', root + '?organization=' + organization.id, create({ admin, organization }))
			.then(({ body, status }) => {
				expect(status).to.equal(201)
				expect(body).to.be.an('object').and.have.property('id')
				doc = body
			})
		)

		it('GET / (1 element)', () =>
			query('get', root + '?organization=' + organization.id + listSuffix).then(({ body, status }) => {
				expect(status).to.equal(200)
				expect(body).to.be.an('array').and.have.length(1 + initialCount)
				if (Model === People) {
					body = body.filter(({ ldapUid }) => ldapUid !== adminLogin)
				}
				if (Model === Organization) {
					body = body.filter(({ id }) => id !== organization.id)
				}
				expect(map(omit(['updatedAt', 'createdAt', 'opts']), body)).to.eql([omit(['updatedAt', 'createdAt'], doc)])
			})
		)

		it('GET /:id (find)', () =>
			query('get', root + '/' + doc.id + '?organization=' + organization.id)
			.then(({ body, status }) => {
				expect(status).to.equal(200)
				expect(omit(['updatedAt', 'createdAt', 'opts'], body)).to.eql(omit(['updatedAt', 'createdAt'], doc))
			})
		)

		it('PUT /:id (update)', () => {
			const updates = update({ admin, organization })
			const data = merge(doc, updates)
			return query('put', root + '/' + doc.id + '?organization=' + organization.id, data)
			.then(({ body, status }) => {
				expect(status).to.equal(200)
				expect(omit(['updatedAt', 'createdAt', 'opts'], body)).to.eql(omit(['updatedAt', 'createdAt'], merge(doc, updates)))
			})
		})

		it('DELETE /:id (remove)', () =>
			query('delete', root + '/' + doc.id + '?organization=' + organization.id)
			.then(({ status }) => expect(status).to.equal(204))
		)

		it('GET / (empty)', () =>
			query('get', root + '?organization=' + organization.id + listSuffix).then(({ body, status }) => {
				expect(status).to.equal(200)
				expect(body).to.be.an('array').and.have.length(0 + initialCount)
			})
		)

	})
}
