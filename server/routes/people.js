'use strict'

const { Router } = require('express')

const router = module.exports = Router()

router.all('/*', (req, res) => res.status(501).send({}))
