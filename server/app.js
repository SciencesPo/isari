'use strict'

const config = require('config')

if (config.specs.validateOnStart) {
	require('./validate-schemas')
}

const express = require('express')
const cors = require('cors')
const logger = require('morgan')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
const routes = require('./routes')
const { rolesMiddleware } = require('./lib/permissions')


const app = module.exports = express()

app.settings['x-powered-by'] = false

app.use(cors({
	origin: true,
	credentials: true
}))

if (config.log.format) {
	app.use(logger(config.log.format))
}

app.use(session({
	secret: config.session.secret,
	resave: true,
	saveUninitialized: false,
	store: new MongoStore({
		url: config.mongo.url,
		ttl: config.session.ttl
	})
}))

app.use(rolesMiddleware)

// Dev only: to be replaced by NG2 version
app.use('/login', (req, res) => res.sendfile(__dirname + '/login.html'))

app.use('/', routes.index)
app.use('/auth', routes.auth)
app.use('/people', routes.people)
app.use('/organizations', routes.organizations)
app.use('/activities', routes.activities)
app.use('/schemas', routes.schemas)
app.use('/layouts', routes.layouts)
app.use('/enums', routes.enums)
app.use('/columns', routes.columns)
app.use('/export', routes.export)

// Error handlers
app.use(routes.errors.notFound)
app.use(routes.errors.serverError(config.http.detailedErrors))
