'use strict'

const { restRouter } = require('../lib/rest-utils')
const { People } = require('../lib/model')
const { format } = require('../lib/model-utils')


const formatObject = (p, perms) => format('People', p, perms)

const getPermissions = (req, p) => Promise.all([
	req.userCanViewPeople(p),
	req.userCanEditPeople(p),
	req.userComputeRestrictedFields('People')
]).then(([ viewable, editable, confidentials ]) => ({
	viewable,
	editable,
	confidentials
}))

const buildListQuery = (req) => req.userListViewablePeople()

module.exports = restRouter(People, formatObject, 'people', getPermissions, buildListQuery)
