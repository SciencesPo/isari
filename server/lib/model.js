'use strict'

const mongoose = require('mongoose')
const { getMongooseSchema } = require('./schemas')
const config = require('config')
const { EditLog, middleware: editLogMiddleware } = require('./edit-logs')

// Use native promises with Mongoose
mongoose.Promise = Promise


module.exports = {
	connect,
	EditLog
}

for (const name in config.collections) {
	module.exports[name] = model(name, config.collections[name])
}


function model (modelName, collectionName) {
	const desc = getMongooseSchema(modelName)

	const schema = new mongoose.Schema(desc, {
		strict: 'throw',
		collection: collectionName
	})

	schema.plugin(editLogMiddleware)

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
