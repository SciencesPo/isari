'use strict'

const { restRouter } = require('../lib/rest-utils')
const { Activity } = require('../lib/model')
const { format } = require('../lib/model-utils')
const { getPermissions } = require('../lib/permissions')


const formatObject = (a, perms) => format(Activity.modelName, a, perms)

const buildListQuery = (req) => req.userListViewableActivities({
	type: req.query.type
})

module.exports = restRouter(Activity, formatObject, getPermissions.Activity, buildListQuery)
