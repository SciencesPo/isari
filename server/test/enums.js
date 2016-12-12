'use strict'

const { expect } = require('chai')
const { connect, People, Organization } = require('../lib/model')
const { agent } = require('./http-utils')

// beware, in less than a thousand years tests will break
const FUTURE = '2999-12-31'
const INVALID_VALUE = 'random value'
const VALID_TYPE = 'encadrement'
const VALID_ROLE = 'Direction'
const VALID_SUBTYPE = 'memoire'

describe('Enums', () => {

	let connection = null
	before(() => connect().then(conn => connection = conn))
	after(() => connection && connection.close())

	before(() => People.remove().exec())
	afterEach(() => People.remove().exec())
	beforeEach(() => People.find().then(l => expect(l).to.be.an('array').of.length(0)))

	it('enum (People.personalActivities.personalActivityType) should accept a value in set', () =>
		(new People({
			name: 'Bob',
			latestChangeBy: 'UnitTests',
			personalActivities: [
				{
					personalActivityType: VALID_TYPE, // The tested value
					startDate: '2015-01-01'
				}
			]
		})).save()
	)

	it('softenum (People.personalActivities.role) should accept a value in set', () =>
		(new People({
			name: 'Bob',
			latestChangeBy: 'UnitTests',
			personalActivities: [
				{
					personalActivityType: VALID_TYPE,
					startDate: '2015-01-01',
					role: VALID_ROLE // The tested value
				}
			]
		})).save()
	)

	it('enum (People.personalActivities.personalActivityType) should *not* accept any value', () =>
		(new People({
			name: 'Bob',
			latestChangeBy: 'UnitTests',
			personalActivities: [
				{
					personalActivityType: INVALID_VALUE, // The tested value
					startDate: '2015-01-01'
				}
			]
		})).save().then(
			() => Promise.reject(Error('Should have failed with ValidationError')),
			e => {
				expect(e).to.be.an.instanceof(Error).with
					.property('name').equal('ValidationError')
				expect(e.errors).to.be.an('object').with
					.property('personalActivities.0.personalActivityType').to.be.an.instanceof(Error).with
					.property('name').to.equal('ValidatorError')
			}
		)
	)

	it('softenum (People.personalActivities.role) should accept any value', () =>
		(new People({
			name: 'Bob',
			latestChangeBy: 'UnitTests',
			personalActivities: [
				{
					personalActivityType: VALID_TYPE,
					startDate: '2015-01-01',
					role: INVALID_VALUE // The tested value
				}
			]
		})).save()
	)

	it('nested softenum (People.personalActivities.personalActivitySubtype) should accept any value', () =>
		(new People({
			name: 'Bob',
			latestChangeBy: 'UnitTests',
			personalActivities: [
				{
					personalActivityType: VALID_TYPE,
					startDate: '2015-01-01',
					personalActivitySubtype: INVALID_VALUE // The tested value
				}
			]
		})).save()
	)

	describe('Suggestions', () => {

		let query = agent()
		let userId = null // eslint-disable-line no-unused-vars
		let orgId = null

		before(() =>
			(new Organization({
				name: 'Test Organization (main)',
				isariMonitored: true,
				latestChangeBy: 'UnitTests'
			})).save()
			.then(({ id }) => orgId = id)
		)

		beforeEach(() =>
			Promise.all([
				new People({
					name: 'Admin',
					ldapUid: 'admin',
					latestChangeBy: 'UnitTests',
					isariAuthorizedCenters: [{ organization: orgId, isariRole: 'central_admin' }],
					academicMemberships: [{ organization: orgId, endDate: FUTURE }]
				}).save(),
				new People({
					name: 'Bob',
					ldapUid: 'bob',
					latestChangeBy: 'UnitTests',
					academicMemberships: [{ organization: orgId, endDate: FUTURE }]
				}).save()
			])
			.then(([ admin, bob ]) => {
				userId = bob.id
				return query('post', '/auth/login', { login: admin.ldapUid, password: 'whatever' })
			})
			.then(({ status }) => {
				expect(status).to.equal(200)
			})
		)

		it('softenum (People.personalActivities.role) should provide set of suggestions (with at least en and fr labels)', () =>
			query('get', '/enums/personalActivityRoles').then(({ body, status }) => {
				expect(status).to.equal(200)
				expect(body).to.be.an('array')
				body.forEach(suggestion => {
					expect(suggestion).to.be.an('object')
					expect(suggestion).to.have.property('value').to.be.a('string')
					expect(suggestion).to.have.property('label').to.be.an('object')
					expect(suggestion.label).to.have.property('fr').to.be.a('string')
					expect(suggestion.label).to.have.property('en').to.be.a('string')
				})
				expect(body.map(s => s.value)).to.include(VALID_ROLE)
			})
		)

		it('enum (People.personalActivities.personalActivityType) should provide set suggestions (with at least en and fr labels)', () =>
			query('get', '/enums/personalActivityTypes').then(({ body, status }) => {
				expect(status).to.equal(200)
				expect(body).to.be.an('array')
				body.forEach(suggestion => {
					expect(suggestion).to.be.an('object')
					expect(suggestion).to.have.property('value').to.be.a('string')
					expect(suggestion).to.have.property('label').to.be.an('object')
					expect(suggestion.label).to.have.property('fr').to.be.a('string')
					expect(suggestion.label).to.have.property('en').to.be.a('string')
				})
				expect(body.map(s => s.value)).to.include(VALID_TYPE)
			})
		)

		it('nested softenum (People.personalActivities.personalActivitySubtype) should provide suggestions based on other field (with at least en and fr labels)', () =>
			query('get', '/enums/nested/personalActivitySubtypes').then(({ body, status }) => {
				expect(status).to.equal(200)
				expect(body).to.be.an('object')
				expect(body).to.have.property(VALID_TYPE)
				expect(body[VALID_TYPE]).to.be.an('array')
				body[VALID_TYPE].forEach(suggestion => {
					expect(suggestion).to.be.an('object')
					expect(suggestion).to.have.property('value').to.be.a('string')
					expect(suggestion).to.have.property('label').to.be.an('object')
					expect(suggestion.label).to.have.property('fr').to.be.a('string')
					expect(suggestion.label).to.have.property('en').to.be.a('string')
				})
				expect(body[VALID_TYPE].map(s => s.value)).to.include(VALID_SUBTYPE)
			})
		)
	})

})
