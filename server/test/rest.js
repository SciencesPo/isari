'use strict'

const { expect } = require('chai')
const { connect, People, Organization, Activity } = require('../lib/model')
const { merge, omit, map } = require('lodash/fp')
const { agent } = require('./http-utils')


describe('REST', () => {

	let connection

	before(() => connect().then(conn => connection = conn))
	after(() => connection && connection.close())

	describeModelRestApi('/people', People, () => ({
		name: 'John Doe'
	}), () => ({
		name: 'John Doe (modified)'
	}))

	describeModelRestApi('/organizations', Organization, () => ({
		name: 'Missing & co'
	}), () => ({
		name: 'Missing & co (modified)'
	}))

	describeModelRestApi('/activities', Activity, () => ({
		name: 'Find someone',
		activityType: 'projetderecherche'
	}), () => ({
		name: 'Find someone (modified)'
	}))

})


function describeModelRestApi (root, Model, create, update) {
	const query = agent()

	describe(`${root} (basics)`, () => {

		let initialCount = Model === People ? 1 : 0 // increment initial count if People, as we add the REST user
		let doc = null
		let adminLogin = 'test.test'

		before(() => Model.remove())

		// Add a user for authentication
		before(() => {
			const admin = new People({
				name: 'Test User',
				ldapUid: adminLogin,
				latestChangeBy: 'UnitTests'
			})
			return admin.save()
		})
		after(() => People.findOne({ ldapUid: adminLogin }).then(o => o ? o.remove() : Promise.reject('Admin not found for cleanup')))

		// Authenticate first
		it('should authenticate', () =>
			query('post', '/auth/login', { login: adminLogin, password: 'whatever' }).then(({ body, status }) => {
				expect(status).to.equal(200)
				expect(body).to.be.an('object').and.have.property('login').to.equal(adminLogin)
				expect(body).to.have.property('people').to.be.an('object').to.have.property('ldapUid').to.equal(adminLogin)
			})
		)
		// Log out at the end
		after(() => query('post', '/auth/logout').then(({ body, status }) => {
			expect(status).to.equal(200)
			expect(body).to.eql({ was: adminLogin })
		}))

		it('should be authenticated', () =>
			query('get', '/auth/myself').then(({ body, status }) => {
				expect(status).to.equal(200)
				expect(body).to.be.an('object').and.have.property('login').to.equal(adminLogin)
				expect(body).to.have.property('people').to.be.an('object').to.have.property('ldapUid').to.equal(adminLogin)
			})
		)

		it('GET / (empty)', () =>
			query('get', root).then(({ body, status }) => {
				expect(status).to.equal(200)
				expect(body).to.be.an('array').and.have.length(0 + initialCount)
			})
		)

		it('POST / (create)', () =>
			query('post', root, create())
			.then(({ body, status }) => {
				expect(status).to.equal(201)
				expect(body).to.be.an('object').and.have.property('id')
				doc = body
			})
		)

		it('GET / (1 element)', () =>
			query('get', root).then(({ body, status }) => {
				expect(status).to.equal(200)
				expect(body).to.be.an('array').and.have.length(1 + initialCount)
				if (Model === People) {
					body = body.filter(({ ldapUid }) => ldapUid !== adminLogin)
				}
				expect(map(omit(['opts', 'updatedAt']), body)).to.eql([omit('updatedAt', doc)])
			})
		)

		it('GET /:id (find)', () =>
			query('get', root + '/' + doc.id)
			.then(({ body, status }) => {
				expect(status).to.equal(200)
				expect(omit(['opts', 'updatedAt'], body)).to.eql(omit('updatedAt', doc))
			})
		)

		it('PUT /:id (update)', () => {
			const updates = update()
			return query('put', root + '/' + doc.id, updates)
			.then(({ body, status }) => {
				expect(status).to.equal(200)
				expect(omit(['opts', 'updatedAt'], body)).to.eql(omit('updatedAt', merge(doc, updates)))
			})
		})

		it('DELETE /:id (remove)', () =>
			query('delete', root + '/' + doc.id)
			.then(({ status }) => expect(status).to.equal(204))
		)

		it('GET / (empty)', () =>
			query('get', root).then(({ body, status }) => {
				expect(status).to.equal(200)
				expect(body).to.be.an('array').and.have.length(0 + initialCount)
			})
		)

	})
}
