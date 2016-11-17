'use strict'

const { restRouter } = require('../lib/rest-utils')
const { People } = require('../lib/model')
const { format } = require('../lib/model-utils')


const formatObject = p => format('People', p)

const getPermissions = (req, p) => Promise.all([
	req.userCanViewPeople(p),
	req.userCanEditPeople(p)
]).then(([ viewable, editable ]) => ({
	viewable,
	editable
	// TODO confidentialFields
}))

const buildListQuery = (req) => req.userListViewablePeople()

module.exports = restRouter(People, formatObject, 'people', getPermissions, buildListQuery)
