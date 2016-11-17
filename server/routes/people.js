'use strict'

const { restRouter } = require('../lib/rest-utils')
const { People } = require('../lib/model')
const { format } = require('../lib/model-utils')


const formatPeople = p => format('People', p)

const getPeoplePermissions = (req, p) => Promise.resolve({
	editable: req.userCanEditPeople(p)
	// TODO confidentialFields
})

const buildListQuery = (req) => req.userListViewablePeople()



module.exports = restRouter(People, formatPeople, 'people', getPeoplePermissions, buildListQuery)
