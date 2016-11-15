'use strict'

const { Router } = require('express')
const columns = require('../../specs/columns.json')
const { restHandler } = require('../lib/rest-utils')

module.exports = Router()
.get('/', restHandler(() => columns))
