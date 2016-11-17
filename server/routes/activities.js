'use strict'

const { restRouter } = require('../lib/rest-utils')
const { Activity } = require('../lib/model')
const { format } = require('../lib/model-utils')


const formatObject = (a, perms) => format('Activity', a, perms)

const getPermissions = (req, a) => Promise.all([
	req.userCanViewActivity(a),
	req.userCanEditActivity(a),
	req.userComputeRestrictedFields('Activity')
]).then(([ viewable, editable, confidentials ]) => ({
	viewable,
	editable,
	confidentials
}))

const buildListQuery = (req) => req.userListViewableActivities()

module.exports = restRouter(Activity, formatObject, 'activities', getPermissions, buildListQuery)
