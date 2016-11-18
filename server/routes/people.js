'use strict'

const { restRouter } = require('../lib/rest-utils')
const { People } = require('../lib/model')
const { format } = require('../lib/model-utils')
const { getPermissions } = require('../lib/permissions')


const formatObject = (p, perms) => format('People', p, perms)

const buildListQuery = (req) => req.userListViewablePeople()

module.exports = restRouter(People, formatObject, 'people', getPermissions.People, buildListQuery)
