'use strict'

const mongoose = require('mongoose')
const { diff: deepDiff, applyChange } = require('deep-diff')
const chalk = require('chalk')
const removeEmptyFields = require('./remove-empty-fields')
const { get, set } = require('lodash')


const EditLogSchema = new mongoose.Schema({
	model: {
		type: String,
		required: true
	},
	date: {
		type: Date,
		required: true
	},
	action: {
		type: String,
		enum: ['create', 'update', 'delete'],
		required: true
	},
	item: {
		type: mongoose.Schema.Types.ObjectId,
		required: true
	},
	data: {
		type: mongoose.Schema.Types.Mixed,
		required: false
	},
	diff: {
		type: mongoose.Schema.Types.Mixed,
		required: false
	},
	who: {
		type: String,
		required: false
	},
	whoID: {
		type: mongoose.Schema.Types.ObjectId,
		required: false
	}
})

EditLogSchema.static('applyChange', (source, change) => {
	const target = Object.assign({}, source)
	if (change.kind === 'A' && !get(target, change.path)) {
		set(target, change.path, [])
	}
	applyChange(target, source, change)
	return target
})


const EditLog = mongoose.model('EditLog', EditLogSchema)


const getWho = doc => {
	const modelName = doc.constructor.modelName
	const who = doc.latestChangeBy

	if (!who) {
		// TODO use proper logger
		const stack = Error().stack.split('\n').slice(2).join('\n')
		process.stderr.write(chalk.yellow(`[EditLog][${modelName}] Field 'latestChangeBy' not set, operation will be logged anonymously\n`))
		process.stderr.write(chalk.yellow(stack) + '\n\n')
	}

	return [ modelName, who ]
}

const middleware = schema => {

	schema.add({
		latestChangeBy: {
			type: String,
			required: true
		}
	})

	schema.post('init', function () {
		this._original = this.toObject()
	})

	schema.pre('save', function (next) {
		const [modelName, who] = getWho(this)
		const data = this.toObject()

		// Create a EditLog instance
		// Store for post-save
		// We need to create it in pre-save to have a working 'isNew' attr
		const editLog = {
			model: modelName,
			item: data._id,
			date: new Date(),
			action: this.isNew ? 'create' : 'update',
			whoID: who
		}

		if (this.isNew) {
			editLog.data = removeEmptyFields(cleanupData(data))
		}
		else {
			// If the model was updated, we only store a diff
			const changes = flattenDiff(deepDiff(cleanupData(this._original), cleanupData(data)))
			if (changes.length === 0) {
				// No change at all: do not save any edit log
				return next()
			}
			if (changes.length === 1 && changes[0].path.length === 1 && changes[0].path[0] === 'latestChangeBy') {
				// No actual change, the only modified field is 'latestChangeBy', which is pretty meaningless
				// Do not save any edit log
				return next()
			}
			editLog.diff = changes
		}

		this._elLogToBeSaved = new EditLog(editLog)

		next()
	})

	schema.post('save', doc => {
		// Save on post-save, to ensure it was actually saved
		if (doc._elLogToBeSaved) {
			doc._elLogToBeSaved.save()
		}
	})

	// TODO: this will be handled differently when we solve the delete conundrum
	schema.post('remove', doc => {
		const [modelName, who] = getWho(doc)

		// Create a EditLog instance
		const log = new EditLog({
			model: modelName,
			item: doc.id,
			date: new Date(),
			data: removeEmptyFields(cleanupData(doc.toObject())),
			action: 'delete',
			who
		})

		// Save it asynchronously
		log.save()
	})

}

const flattenDiff = diffs => diffs.map(diff => Array.isArray(diff) && diff.length === 1 ? diff[0] : diff)

const cleanupData = (data, subDoc = false, returnNullIfNotModified = false) => {
	if (!data) {
		return returnNullIfNotModified ? null : data
	}

	// Sub-document: if it has an id, the whole object should be replace with this value
	if (subDoc && data._id instanceof mongoose.mongo.ObjectID) {
		return getID(data)
	}

	// Standard case, just cleanup object
	let modified = false
	const newData = Object.keys(data).reduce((res, k) => {
		// Handle ObjectID
		if (data[k] instanceof mongoose.mongo.ObjectID) {
			res[k] = asID(data[k])
			modified = true
		}
		// Remove special fields
		else if (k !== '_id' && k[0] === '_') {
			// SKIP FIELD
			modified = true
		}
		// Replace populated data with id
		else if (typeof data[k] === 'object' && data[k]._id instanceof mongoose.mongo.ObjectID) {
			res[k] = getID(data[k])
			modified = true
		}
		// Collection
		else if (Array.isArray(data[k])) {
			res[k] = data[k].map(o => {
				if (returnNullIfNotModified) {
					const o2 = cleanupData(o, true, true)
					if (o2) {
						modified = true
						return o2
					} else {
						return o
					}
				} else {
					return cleanupData(o, true, false)
				}
			})
		}
		// Other cases: just inject field
		else {
			res[k] = data[k]
		}
		return res
	}, {})

	if (!modified && returnNullIfNotModified) {
		return null
	} else {
		return newData
	}
}

const getID = o => o && (asID(o._id) || asID(o.id))

const asID = id => id && (id.toHexString ? id.toHexString() : String(id))


module.exports = {
	EditLogSchema,
	EditLog,
	middleware,
	cleanupData,
	flattenDiff,
}
