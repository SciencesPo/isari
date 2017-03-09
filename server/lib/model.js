'use strict'

const mongoose = require('mongoose')
const { getMongooseSchema } = require('./schemas')
const { populateAll, applyTemplates, getRelated } = require('./model-utils')
const config = require('config')
const { EditLog, middleware: editLogMiddleware } = require('./edit-logs')
const timestamps = require('mongoose-timestamp')


// Use native promises with Mongoose
mongoose.Promise = Promise
mongoose.set('debug', true);

module.exports = {
	connect,
	EditLog
}

const modelNames = []

for (const name in config.collections) {
	module.exports[name] = model(name, config.collections[name])
	modelNames.push(name)
}


function model (modelName, collectionName) {
	const desc = getMongooseSchema(modelName)
	const related = getRelated(modelName)

	const schema = new mongoose.Schema(desc, {
		strict: 'throw',
		collection: collectionName
	})

	schema.plugin(editLogMiddleware)
	schema.plugin(timestamps)

	schema.static('removeById', function (id) {
		return this.remove({ _id: id })
	})

	schema.static('relationsById', function(id) {
		const promises = modelNames
			.map(name => {
				const paths = related[name]

				if (!paths || !paths.length)
					return Promise.resolve([])

				const query = {
					$or: paths.map(path => ({[path]: id}))
				}

				return module.exports[name].find(query).exec()
			})

		return Promise.all(promises)
			.then(results => {
				const o = {}

				results.forEach((items, i) => {
					o[modelNames[i]] = items
				})

				return o
			})
	})

	schema.method('populateAll', function () {
		return populateAll(this, modelName)
	})

	schema.method('applyTemplates', function (scope, depth = 1) {
		return applyTemplates(this, modelName, scope, depth)
	})

	return mongoose.model(modelName, schema)
}

function connect (url = null) {
	return new Promise((resolve, reject) => {
		mongoose.connect(url || config.mongo.url, e => e ? reject(e) : resolve(mongoose.connection))
	})
}
