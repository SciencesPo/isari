'use strict'

const { restRouter } = require('../lib/rest-utils')
const { Organization } = require('../lib/model')
const { format } = require('../lib/model-utils')


const formatObject = (o, perms) => format('Organization', o, perms)

const pTrue = Promise.resolve(true)

const getPermissions = (req, o) => Promise.all([
	pTrue,
	req.userCanEditOrganization(o),
	req.userComputeRestrictedFields('Organization')
]).then(([ viewable, editable, confidentials ]) => ({
	viewable,
	editable,
	confidentials
}))

// No buildListQuery here: all organizations are viewable by anyone

module.exports = restRouter(Organization, formatObject, 'organizations', getPermissions)
