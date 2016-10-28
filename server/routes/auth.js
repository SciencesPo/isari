'use strict'

const { Router } = require('express')
const bodyParser = require('body-parser')
const auth = require('../lib/auth')
const { People } = require('../lib/model')
const { format } = require('../lib/model-utils')
const { UnauthorizedError } = require('../lib/errors')

const router = module.exports = Router()

const formatPeople = p => format('People', p)
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
