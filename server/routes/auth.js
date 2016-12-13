'use strict'

const { Router } = require('express')
const bodyParser = require('body-parser')
const auth = require('../lib/auth')
const { People, Organization } = require('../lib/model')
const { format } = require('../lib/model-utils')
const { UnauthorizedError } = require('../lib/errors')
const { computeRestrictedFields, getPeopleOrgRoles, getPeopleCentralRole } = require('../lib/permissions')
const config = require('config')


const router = module.exports = Router()

// Permissions on my People's instance
const MY_PERMISSIONS = { viewable: true, editable: false, confidentials: { viewable: true, editable: false, paths: [] } }

const formatPeople = p => format('People', p, MY_PERMISSIONS)
const formatOrganizations = req => orgs => Promise.all(orgs.map(o =>
	Promise.resolve(o)
	.then(o => format('Organization', o, MY_PERMISSIONS))
	.then(o => {
		o.isariRole = req.userRoles[o.id] // Restore 'isariRole' which could have been removed from format
		return Promise.all([
			computeRestrictedFields('People', req.userCentralRole, req.userRoles, o.id),
			computeRestrictedFields('Organization', req.userCentralRole, req.userRoles, o.id),
			computeRestrictedFields('Activity', req.userCentralRole, req.userRoles, o.id)
		]).then(([ peopleRestrictedFields, organizationRestrictedFields, activityRestrictedFields ]) => {
			o.restrictedFields = {
				people: peopleRestrictedFields.paths,
				organizations: organizationRestrictedFields.paths,
				activities: activityRestrictedFields.paths
			}
			return o
		})
	})
))
const populateAndFormatPeople = p => p.populateAll().then(formatPeople)

const parseJson = bodyParser.json()
const parseForm = bodyParser.urlencoded({
	extended: true
})

router.post('/login', parseJson, parseForm, (req, res, next) => {
	const { login, password } = req.body
	auth(login, password)
	.then(people => Promise.all(
		[
			getPeopleOrgRoles(people),
			getPeopleCentralRole(people)
		]).then(([roles, central]) => {
			if (!central && Object.keys(roles).length === 0) {
				return Promise.reject({ message: 'No accessible organization', status: 403 })
			} else {
				return people
			}
		})
	)
	.then(populateAndFormatPeople)
	.then(people => {
		req.session.login = login
		res.send({ login, people })
	})
	.catch(err => next(UnauthorizedError({ title: err.message, status: err.status })))
})

router.post('/logout', parseJson, parseForm, (req, res) => {
	const was = req.session.login
	req.session.login = null
	res.send({ was })
})

router.get('/myself', parseJson, parseForm, (req, res, next) => {
	Promise.resolve(req.session.login)
	.then(login => login || Promise.reject(UnauthorizedError({ title: 'Not logged in' })))
	.then(login =>
		People.findOne({ ldapUid: login })
		.then(found => found || Promise.reject(UnauthorizedError({ title: 'People not found' })))
		.then(populateAndFormatPeople)
		.then(people => res.send({ login, people }))
	)
	.catch(next)
})

router.get('/permissions', (req, res, next) => {
	if (!req.session.login) {
		return next(UnauthorizedError({ title: 'Not logged in' }))
	}
	const orgs = req.userCentralRole
		? // User is central: provide access to all organizations + fake global one
			Organization.find({ isariMonitored: true }).then(orgs => [config.globalOrganization].concat(orgs))
		: // General case: provide access to its own organizations}
			Organization.find({ _id: { $in: Object.keys(req.userRoles) } })

	orgs
	.then(formatOrganizations(req))
	.then(organizations => res.send({
		organizations,
		central: req.userCentralRole
	}))
	.catch(next)
})
