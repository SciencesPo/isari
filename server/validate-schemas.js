'use strict'

const config = require('config')
const chalk = require('chalk')
const { getFrontSchema, getMongooseSchema } = require('./lib/schemas')
const { getLayout } = require('./lib/layouts')
const { uniq } = require('lodash/fp')


console.log('Validating schemas and layouts…') // eslint-disable-line no-console

let invalids = []

Object.keys(config.collections).forEach(name => {
	try {
		getMongooseSchema(name)
	} catch (e) {
		process.stderr.write(`\n\n${chalk.bold.red(`Fatal error in schema (mongoose) "${name}"`)}:\n${chalk.red(e.message)}\n\n`)
		invalids.push(name)
	}
	try {
		getFrontSchema(name, false)
	} catch (e) {
		process.stderr.write(`\n\n${chalk.bold.red(`Fatal error in schema (front, restricted excluded) "${name}"`)}:\n${chalk.red(e.message)}\n\n`)
		invalids.push(name)
	}
	try {
		getFrontSchema(name, true)
	} catch (e) {
		process.stderr.write(`\n\n${chalk.bold.red(`Fatal error in schema (front, restricted included) "${name}"`)}:\n${chalk.red(e.message)}\n\n`)
		invalids.push(name)
	}
	try {
		getLayout(name, false)
	} catch (e) {
		process.stderr.write(`\n\n${chalk.bold.red(`Fatal error in layout (restricted excluded) "${name}"`)}:\n${chalk.red(e.message)}\n\n`)
		invalids.push(name)
	}
	try {
		getLayout(name, true)
	} catch (e) {
		process.stderr.write(`\n\n${chalk.bold.red(`Fatal error in layout (restricted included) "${name}"`)}:\n${chalk.red(e.message)}\n\n`)
		invalids.push(name)
	}
})
if (invalids.length > 0) {
	process.stderr.write(`\n\n${chalk.bold.red(`Fatal error in following schemas: ${uniq(invalids).join(', ')}`)}\n${chalk.red('Check errors above')}\n\n`)
	process.exit(1)
}

console.log('Successfully validated schemas and layouts!') // eslint-disable-line no-console
