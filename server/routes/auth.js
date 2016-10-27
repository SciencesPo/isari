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
	.then(() => {
		req.session.user = login
		res.send({ login })
	})
	.catch(err => {
		return res.status(403).send({
			error: err.message
		})
	})
})

router.post('/logout', (req, res) => {
	const was = req.session.user
	req.session.user = null
	res.send({ was })
})

router.get('/myself', (req, res) => {
	if (!req.session.user) {
		return res.status(401).send({
			redirect: req.baseUrl + '/login',
			message: 'Not authenticated'
		})
	}
	res.send({
		login: req.session.user
	})
})
