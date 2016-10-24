'use strict'

const { expect } = require('chai')
const { connect, People, Organization, Activity } = require('../lib/model')
const { mapValues } = require('lodash/fp')
const { inspect } = require('util')


describe('Model', () => {

	let connection

	before(() => connect().then(conn => connection = conn))
	after(() => connection && connection.close())

	describeModel('People', People, () => ({
		name: 'John Doe'
	}))

	describeModel('Organization', Organization, () => ({
		name: 'Missing & co'
	}))

	describeModel('Activity', Activity, () => ({
		name: 'Find someone',
		activityType: 'projetderecherche'
	}))

})


function describeModel (name, Model, create) {
	describe(`${name} (basics)`, () => {

		let id

		it('should be valid model', () => {
			expect(Model).to.be.a('function').and.have.property('name', 'model')
			expect(new Model).to.be.an.instanceOf(require('mongoose').Model).and.have.property('_id')
		})

		it('should empty collection', () =>
			Model.remove()
		)

		it('should have no element left', () =>
			Model.find().then(os => expect(os).to.be.an('array').and.have.length(0))
		)

		it('should add element', () => {
			const o = new Model(create())
			o._elWho = 'Test User'
			return o.save()
				.then(o => id = o.id)
				.catch(e => {
					if (e.name === 'ValidationError') {
						e.message = inspect(mapValues('message', e.errors))
					}
					throw e
				})
		})

		it('should have one element', () =>
			Model.find().then(os => expect(os).to.be.an('array').and.have.length(1))
		)

		it('should find by id', () =>
			Model.findById(id).then(o => expect(o).to.be.an('object'))
		)

		it('should delete by id', () =>
			Model.removeById(id)
		)

		it('should have no element left', () =>
			Model.find().then(os => expect(os).to.be.an('array').and.have.length(0))
		)

	})
}
