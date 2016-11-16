'use strict'

const { restRouter } = require('../lib/rest-utils')
const { People } = require('../lib/model')
const { format } = require('../lib/model-utils')
const { getScopePeopleIds } = require('../lib/permissions')


const formatPeople = p => format('People', p)

const isExternal = p => {
	// TODO refactor "today"
	const d = new Date()
	const pad = s => String(s).length === 1 ? '0' + s : String(s)
	const today = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate)}`

	return !p.academicMemberships.some(m => m.endDate && m.endDate >= today && m.organization.isariMonitored)
}

const getPeoplePermissions = (req, p) => Promise.resolve({
	editable: isExternal(p) || req.userId === String(p._id)
	// TODO || connected user is admin
	// TODO p._external does not exist in GET /:id which does not use lookup
})

const buildListQuery = (req) => getScopePeopleIds(req)
	.then(ids => ({
		// Populate to allow getPeoplePermissions to work
		query: People.find({ _id: { $in: ids } }).populate('academicMemberships.organization')
	}))

module.exports = restRouter(People, formatPeople, 'people', getPeoplePermissions, buildListQuery)
