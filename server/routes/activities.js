'use strict'

const { restRouter } = require('../lib/rest-utils')
const { Activity } = require('../lib/model')
const { format } = require('../lib/model-utils')
const { getPermissions } = require('../lib/permissions')


const formatObject = (a, perms) => format('Activity', a, perms)

const buildListQuery = (req) => req.userListViewableActivities()

module.exports = restRouter(Activity, formatObject, 'activities', getPermissions.Activity, buildListQuery)
