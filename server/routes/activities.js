'use strict'

const { restRouter } = require('../lib/rest-utils')
const { Activity } = require('../lib/model')
const { format } = require('../lib/model-utils')


const formatObject = a => format('Activity', a)

const getPermissions = (req, a) => Promise.resolve({
	editable: req.userCanEditActivity(a)
	// TODO confidentialFields
})

const buildListQuery = (req) => req.userListViewableActivities()

module.exports = restRouter(Activity, formatObject, 'activities', getPermissions, buildListQuery)
