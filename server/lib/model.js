'use strict'

const mongoose = require('mongoose')
const { getMongooseSchema } = require('./schemas')
const config = require('config')

// Use native promises with Mongoose
mongoose.Promise = Promise


module.exports = {
	People:       model('People', 'people'),
	Activity:     model('Activity', 'activities'),
	Organization: model('Organization', 'organizations'),
	connect
}


function model (modelName, collectionName) {
	const desc = getMongooseSchema(modelName)

	const schema = new mongoose.Schema(desc, {
		strict: 'throw',
		collection: collectionName
	})

	schema.static('removeById', function (id) {
		return this.remove({ _id: id })
	})

	return mongoose.model(modelName, schema)
}

function connect (url = null) {
	return new Promise((resolve, reject) => {
		mongoose.connect(url || config.mongo.url, e => e ? reject(e) : resolve(mongoose.connection))
	})
}
