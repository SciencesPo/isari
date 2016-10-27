'use strict'

const { Router } = require('express')
const bodyParser = require('body-parser')
const auth = require('../lib/auth')

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
		req.session.peopleId = people.id
		res.send({ login, peopleId: people.id })
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

router.get('/myself', (req, res) => {
	if (!req.session.login) {
		return res.status(401).send({
			redirect: req.baseUrl + '/login',
			message: 'Not authenticated'
		})
	}
	res.send({
		login: req.session.login,
		peopleId: req.session.peopleId
	})
})
