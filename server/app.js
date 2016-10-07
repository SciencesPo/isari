'use strict'

const express = require('express')
const logger = require('morgan')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
const config = require('config')
const routes = require('./routes')

// Loaded right here to force schema validation at boot time
const chalk = require('chalk')
const { getFrontSchema, getMongooseSchema } = require('./lib/schemas')
const { getLayout } = require('./lib/layouts')
let errors = []
Object.keys(config.collections).forEach(name => {
	try {
		getMongooseSchema(name)
		getLayout(name)
		getFrontSchema(name)
	} catch (e) {
		process.stderr.write(`\n\n${chalk.bold.red(`Fatal error in schema "${name}"`)}:\n${chalk.red(e.message)}\n\n`)
		errors.push(name)
	}
})
if (errors.length > 0) {
	process.stderr.write(`\n\n${chalk.bold.red(`Fatal error in following schemas: ${errors.join(', ')}`)}\n${chalk.red('Check errors above')}\n\n`)
	process.exit(1)
}


const app = module.exports = express()

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

app.use('/', routes.index)
app.use('/auth', routes.auth)
app.use('/people', routes.people)
app.use('/organizations', routes.organizations)
app.use('/activities', routes.activities)
app.use('/schemas', routes.schemas)
app.use('/layouts', routes.layouts)
app.use('/enums', routes.enums)

// Error handlers
app.use(routes.errors.notFound)
app.use(routes.errors.serverError(app.get('env') === 'development'))
