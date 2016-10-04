'use strict'

const mongoose = require('mongoose')
const { getSchema } = require('./schemas')

module.exports = {
	People:       model('People'),
	Activity:     model('Activity'),
	Organization: model('Organization')
}


function model (name) {
	const desc = getSchema(name)
	const schema = new mongoose.Schema(desc)
	return mongoose.model(name, schema)
}
