'use strict'

const { Router } = require('express')
const bodyParser = require('body-parser')
const auth = require('../lib/auth')
const { People, Organization } = require('../lib/model')
const { format } = require('../lib/model-utils')
const { UnauthorizedError } = require('../lib/errors')
const debug = require('debug')('isari:credentials')
const { getPeopleRoles, isPeopleCentral } = require('../lib/permissions')
const { map } = require('lodash/fp')

const router = module.exports = Router()

const formatPeople = p => format('People', p)
const formatOrganization = o => format('Organization', o)
const populateAndFormatPeople = p => p.populateAll().then(formatPeople)

const parseJson = bodyParser.json()
const parseForm = bodyParser.urlencoded({
	extended: true
})

router.post('/login', parseJson, parseForm, (req, res, next) => {
	const { login, password } = req.body
	auth(login, password)
	.then(populateAndFormatPeople)
	.then(people => {
		req.session.login = login
		res.send({ login, people })
	})
	.catch(err => next(UnauthorizedError({ title: err.message })))
})

router.post('/logout', parseJson, parseForm, (req, res) => {
	const was = req.session.login
	req.session.login = null
	res.send({ was })
})

router.get('/myself', parseJson, parseForm, (req, res, next) => {
	Promise.resolve(req.session.login)
	.then(login => login || Promise.reject(UnauthorizedError({ title: 'Not logged in' })))
	.then(login =>
		People.findOne({ ldapUid: login })
		.then(found => found || Promise.reject(UnauthorizedError({ title: 'People not found' })))
		.then(populateAndFormatPeople)
		.then(people => res.send({ login, people }))
	)
	.catch(next)
})

router.get('/permissions', (req, res, next) => {
	if (!req.session.login) {
		return next(UnauthorizedError({ title: 'Not logged in' }))
	}
	Organization.find({ _id: { $in: Object.keys(req.userRoles) } })
	.then(map(formatOrganization))
	.then(map(o => Object.assign(o, { isariRole: req.userRoles[o.id] })))
	.then(organizations => res.send({
		organizations,
		central: req.userIsCentral
	}))
	.catch(next)
})

// Credentials middleware
router.rolesMiddleware = (req, res, next) => {
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

		req.userPeople = people
		req.userRoles = getPeopleRoles(people)
		req.userIsCentral = isPeopleCentral(people)
		debug(req.userRoles)
		next()
	})
}
