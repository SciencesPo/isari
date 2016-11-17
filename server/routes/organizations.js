'use strict'

const { restRouter } = require('../lib/rest-utils')
const { Organization } = require('../lib/model')
const { format } = require('../lib/model-utils')


const formatObject = o => format('Organization', o)

const getPermissions = (req, p) => Promise.resolve({
	editable: req.userCanEditOrganization(p)
	// TODO confidentialFields
})

// No buildListQuery here: all organizations are viewable by anyone

module.exports = restRouter(Organization, formatObject, 'organizations', getPermissions)
