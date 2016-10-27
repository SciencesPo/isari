'use strict'

const { restRouter } = require('../lib/rest-utils')
const { Organization } = require('../lib/model')
const { format } = require('../lib/model-utils')


module.exports = restRouter(Organization, o => format('Organization', o), 'organizations')
