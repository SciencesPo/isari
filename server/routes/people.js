'use strict'

const { restRouter } = require('../lib/rest-utils')
const { People } = require('../lib/model')
const { format } = require('../lib/model-utils')
const { getPermissions } = require('../lib/permissions')


const formatObject = (p, perms) => format(People.modelName, p, perms)

// Default ?include = members + externals
const buildListQuery = (req) => req.userListViewablePeople({
	includeExternals: false,
	includeMembers: req.query.include !== 'range' && (!req.query.include || req.query.include === 'both' || req.query.include === 'members'),
	includeRange: req.query.include === 'range',
	membershipStart: req.query.start,
	membershipEnd: req.query.end
})

module.exports = restRouter(People, formatObject, getPermissions.People, buildListQuery)
