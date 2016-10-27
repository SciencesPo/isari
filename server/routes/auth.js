'use strict'

const { Router } = require('express')
const bodyParser = require('body-parser')
const auth = require('../lib/auth')
const { People } = require('../lib/model')
const { format } = require('../lib/model-utils')

const router = module.exports = Router()

router.use(bodyParser.json())
router.use(bodyParser.urlencoded({
	extended: true
}))

router.post('/login', (req, res) => {
	const { login, password } = req.body
	auth(login, password)
	.then(people => {
		req.session.login = login
		res.send({ login, people: format(people) })
	})
	.catch(err => {
		return res.status(403).send({
			error: err.message
		})
	})
})

router.post('/logout', (req, res) => {
	const was = req.session.login
	req.session.login = null
	res.send({ was })
})

const formatPeople = p => format('People', p)

router.get('/myself', (req, res, next) => {
	if (!req.session.login) {
		return res.status(401).send({
			redirect: req.baseUrl + '/login',
			message: 'Not authenticated'
		})
	}
	const login = req.session.login
	People.findById(req.session.peopleId)
	.then(p => p.populateAll())
	.then(formatPeople)
	.then(people => res.send({ login, people }))
	.catch(next)
})
