'use strict'

const { restRouter } = require('../lib/rest-utils')
const { Activity } = require('../lib/model')
const { format } = require('../lib/model-utils')


module.exports = restRouter(Activity, a => format('Activity', a), 'activities')
