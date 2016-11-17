'use strict'

const { restRouter } = require('../lib/rest-utils')
const { Organization } = require('../lib/model')
const { format } = require('../lib/model-utils')


const formatObject = o => format('Organization', o)

const pTrue = Promise.resolve(true)

const getPermissions = (req, o) => Promise.all([
	pTrue,
	req.userCanEditOrganization(o)
]).then(([ viewable, editable ]) => ({
	viewable,
	editable
	// TODO confidentialFields
}))

// No buildListQuery here: all organizations are viewable by anyone

module.exports = restRouter(Organization, formatObject, 'organizations', getPermissions)
