'use strict'

const { restRouter } = require('../lib/rest-utils')
const { People } = require('../lib/model')
const { format } = require('../lib/model-utils')


module.exports = restRouter(People, p => format('People', p), 'people')
