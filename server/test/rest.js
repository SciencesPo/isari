'use strict'

const { expect } = require('chai')
const { connect, People, Organization, Activity } = require('../lib/model')
const app = require('../app')
const request = require('supertest-as-promised')(Promise)
const { merge, omit, map } = require('lodash/fp')


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
	describe(`${root} (basics)`, () => {

		let doc

		before(() => Model.remove())

		it('GET / (empty)', () =>
			query('get', root).then(({ body, status }) => {
				expect(status).to.equal(200)
				expect(body).to.be.an('array').and.have.length(0)
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
				expect(body).to.be.an('array').and.have.length(1)
				expect(map(omit('opts'), body)).to.eql([doc])
			})
		)

		it('GET /:id (find)', () =>
			query('get', root + '/' + doc.id)
			.then(({ body, status }) => {
				expect(status).to.equal(200)
				expect(omit('opts', body)).to.eql(doc)
			})
		)

		it('PUT /:id (update)', () => {
			const updates = update()
			return query('put', root + '/' + doc.id, updates)
			.then(({ body, status }) => {
				expect(status).to.equal(200)
				expect(omit('opts', body)).to.eql(merge(doc, updates))
			})
		})

		it('DELETE /:id (remove)', () =>
			query('delete', root + '/' + doc.id)
			.then(({ status }) => expect(status).to.equal(204))
		)

		it('GET / (empty)', () =>
			query('get', root).then(({ body, status }) => {
				expect(status).to.equal(200)
				expect(body).to.be.an('array').and.have.length(0)
			})
		)

	})
}

function query (method, url, data) {
	let req = request(app)[method](url)
	if (data) {
		req = req.send(data)
	}
	return req.then(res => {
		if (String(res.status)[0] !== '2' && res.status !== 301 && res.status !== 302) {
			throw new Error(`[${res.status}] ${res.text}`)
		} else {
			return res
		}
	})
}
