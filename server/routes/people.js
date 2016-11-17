'use strict'

const { restRouter } = require('../lib/rest-utils')
const { People } = require('../lib/model')
const { format } = require('../lib/model-utils')


const formatObject = p => format('People', p)

const getPermissions = (req, p) => Promise.resolve({
	editable: req.userCanEditPeople(p)
	// TODO confidentialFields
})

const buildListQuery = (req) => req.userListViewablePeople()

module.exports = restRouter(People, formatObject, 'people', getPermissions, buildListQuery)
