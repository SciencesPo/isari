'use strict'

const { Router } = require('express')
const bodyParser = require('body-parser')

const router = module.exports = Router()

router.use(bodyParser.json())
router.use(bodyParser.urlencoded({
	extended: true
}))

router.post('/login', (req, res) => {
	req.session.user = 'ok'
	res.send({
		username: 'ok'
	})
})

router.get('/myself', (req, res) => {
	if (!req.session.user) {
		return res.status(401).send({
			redirect: req.baseUrl + '/login',
			message: 'Not authenticated'
		})
	}
	res.send({
		username: req.session.user
	})
})
