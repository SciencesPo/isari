'use strict'

const { restRouter } = require('../lib/rest-utils')
const { Organization } = require('../lib/model')
const { format } = require('../lib/model-utils')
const { getPermissions } = require('../lib/permissions')


const formatObject = (o, perms) => format(Organization.modelName, o, perms)

// No buildListQuery here: all organizations are viewable by anyone

module.exports = restRouter(Organization, formatObject, getPermissions.Organization)
